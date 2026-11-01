const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../services/sendgridEmail');
const validator = require('../middleware/validator');

exports.register = async (req, res) => {
  // FIX: Dynamic import for uuid (ES Module fix)
  const { v4: uuidv4 } = await import('uuid');

  const body = req.body || {};
  const { password, firstName, lastName, phone } = body;
  const requestedRole = body.role || 'customer';
  const suppliedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  // The legacy schema requires email; phone-only accounts receive a non-deliverable internal identifier.
  const email = suppliedEmail || (normalizedPhone ? `${normalizedPhone.replace(/[^0-9]/g, '')}@phone.local` : '');

  if (!['customer', 'vendor'].includes(requestedRole)) {
    return res.status(400).json({ success: false, error: 'Invalid registration role. Administrator accounts can only be created through the secure setup script.' });
  }

  const validation = validator.validateRegistration(body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: validation.errors
    });
  }

  if ((!suppliedEmail && !normalizedPhone) || !password) {
    return res.status(400).json({ success: false, error: 'Phone number or email and password are required.' });
  }

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR ($2 <> '' AND phone = $2)",
      [email, normalizedPhone]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '❌ Email already exists!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const isVendor = requestedRole === 'vendor';

    // Create user - vendors need admin approval to login
    const isActive = !isVendor; // Vendors start inactive (need approval)
    
    const newUser = await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, email, first_name, last_name, phone, role
    `, [
      userId,
      email,
      hashedPassword,
      firstName || '',
      lastName || '',
      phone || '',
      requestedRole,
      isActive
    ]);

    console.log(`✅ New user created: ${email} (${requestedRole})`);

    let otpSent = false;
    if (suppliedEmail) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await pool.query('DELETE FROM email_verification_otps WHERE email = $1', [email]);
      await pool.query(
        'INSERT INTO email_verification_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
        [email, otp, expiresAt]
      );
      const emailResult = await sendOTPEmail(email, otp);
      otpSent = Boolean(emailResult.success);
    }

    res.status(200).json({
      success: true,
      message: isVendor
        ? 'Registration submitted. This account is pending admin approval.'
        : suppliedEmail ? 'Registration successful. Check your email for verification.' : 'Registration successful. Phone verification must be completed through the configured OTP provider.',
      email: suppliedEmail || null,
      phone: normalizedPhone || null,
      isVendor: isVendor,
      otpSent,
      phoneVerificationRequired: !suppliedEmail
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.login = async (req, res) => {
  const body = req.body || {};
  const identifier = String(body.identifier || body.email || body.phone || '').trim();
  const password = body.password;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Phone number or email and password are required.' });
  }

  try {
    const isEmail = identifier.includes('@');
    const result = await pool.query(
      isEmail
        ? 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)'
        : 'SELECT * FROM users WHERE phone = $1 OR email = $2',
      isEmail ? [identifier] : [identifier, `${identifier.replace(/[^0-9]/g, '')}@phone.local`]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Phone number/email or password is incorrect.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: '❌ Email or password is wrong!'
      });
    }

    // Check if user account is active (admin approval for vendors)
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: '❌ Your account has not been approved by admin yet. Please wait for approval.'
      });
    }

    // For vendors, check store status
    let storeStatus = null;
    if (user.role === 'vendor') {
      const storeResult = await pool.query(
        'SELECT is_verified, is_active FROM stores WHERE owner_id = $1',
        [user.id]
      );
      
      if (storeResult.rows.length === 0) {
        storeStatus = 'not_created';
      } else {
        const store = storeResult.rows[0];
        if (!store.is_verified) {
          storeStatus = 'pending_approval';
        } else if (!store.is_active) {
          storeStatus = 'suspended';
        } else {
          storeStatus = 'approved';
        }
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '✅ Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        storeStatus: storeStatus
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, profile_picture, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, phone, role`,
      [firstName, lastName, phone, userId]
    );

    res.json({
      success: true,
      message: '✅ Profile updated successfully!',
      user: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const passwordMatch = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: '❌ Old password is incorrect!'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: '✅ Password changed successfully!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '❌ Email, OTP and new password are required!'
      });
    }

    const otpResult = await pool.query(
      'SELECT * FROM email_verification_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW() LIMIT 1',
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: '❌ Invalid or expired OTP!'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashedPassword, email]
      );
    }

    await pool.query('DELETE FROM email_verification_otps WHERE email = $1', [email]);

    res.json({
      success: true,
      message: '✅ Password reset successfully! You can now login with your new password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query('DELETE FROM email_verification_otps WHERE email = $1', [email]);
    await pool.query(
      'INSERT INTO email_verification_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      return res.json({
        success: true,
        message: 'OTP sent successfully! Please check your email.'
      });
    }

    console.log(`⚠️ Email failed for ${email}, OTP: ${otp}`);
    return res.json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.'
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM email_verification_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW() LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    });
  }
}; 
