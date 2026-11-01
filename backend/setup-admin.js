/**
 * Securely create or reset the platform administrator.
 * Required environment variables: ADMIN_PASSWORD, DATABASE_URL, JWT_SECRET.
 * Optional: ADMIN_EMAIL (defaults to admin@mymart.com), ADMIN_FIRST_NAME, ADMIN_LAST_NAME.
 * Run from backend/: ADMIN_PASSWORD='a-long-unique-password' node setup-admin.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@mymart.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Platform';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters long.');
  }
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters. No default password is provided.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error('ADMIN_EMAIL is not a valid email address.');

  const pool = require('./src/config/database');
  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = 'admin',
         is_active = true,
         email_verified = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, email, first_name, last_name, role, is_active`,
      [adminEmail, passwordHash, adminFirstName, adminLastName]
    );
    const admin = result.rows[0];
    console.log('Administrator account is ready.');
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.is_active}`);
    console.log('Password: supplied via ADMIN_PASSWORD (not printed).');
    console.log('For security, keep the password out of chat, source code, and version control.');
  } finally {
    await pool.end();
  }
}

setupAdmin().catch((error) => {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
});
