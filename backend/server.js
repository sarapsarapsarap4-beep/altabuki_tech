const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const supabaseAuthRoutes = require('./src/routes/supabaseAuth');
const storeRoutes = require('./src/routes/stores');
const categoryRoutes = require('./src/routes/categories');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const reviewRoutes = require('./src/routes/reviews');
const paymentRoutes = require('./src/routes/payments');
const wishlistRoutes = require('./src/routes/wishlist');
const returnRoutes = require('./src/routes/returns');
const disputeRoutes = require('./src/routes/disputes');
const shippingRoutes = require('./src/routes/shipping');
const notificationRoutes = require('./src/routes/notifications');
const couponRoutes = require('./src/routes/coupons');
const vendorDashboardRoutes = require('./src/routes/vendorDashboard');
const searchRoutes = require('./src/routes/search');
const adminDashboardRoutes = require('./src/routes/adminDashboard');
const adminOrdersRoutes = require('./src/routes/adminOrders');
const stripePaymentRoutes = require('./src/routes/stripePayments');
const settlementRoutes = require('./src/routes/settlementRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const bulkRoutes = require('./src/routes/bulkRoutes');
const storageRoutes = require('./src/routes/storage');
const bannerRoutes = require('./src/routes/banners');
const adminStoreRoutes = require('./src/routes/adminStore');
const vendorCouponRoutes = require('./src/routes/vendorCoupons');
const rateLimiter = require('./src/middleware/rateLimiter');
const wifiVoucherRoutes = require('./src/routes/wifiVouchers');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/auth', rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20, message: { success: false, error: 'Too many auth attempts. Please try again later.' } }));
app.use('/api', rateLimiter({ windowMs: 60 * 1000, maxRequests: 100 }));

// ==================== DATABASE MIGRATION ====================
async function runMigrations() {
  try {
    console.log('🔧 Running database migrations...');
    
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'email_verification_otps' 
          AND column_name = 'pending_registration_data'
        ) THEN
          ALTER TABLE email_verification_otps ADD COLUMN pending_registration_data JSONB;
          RAISE NOTICE '✅ Column pending_registration_data added successfully!';
        ELSE
          RAISE NOTICE '✅ Column pending_registration_data already exists!';
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'coupons' AND column_name = 'applicable_users'
        ) THEN
          ALTER TABLE coupons ADD COLUMN applicable_users UUID[];
          RAISE NOTICE '✅ Column applicable_users added to coupons table!';
        ELSE
          RAISE NOTICE '✅ Column applicable_users already exists!';
        END IF;
      END $$;
    `);

    // Returns table enhancements
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'returns' AND column_name = 'refund_amount'
        ) THEN
          ALTER TABLE returns ADD COLUMN refund_amount DECIMAL(10,2);
          ALTER TABLE returns ADD COLUMN vendor_notes TEXT;
          ALTER TABLE returns ADD COLUMN images JSONB DEFAULT '[]';
          ALTER TABLE returns ADD COLUMN resolved_at TIMESTAMP;
          RAISE NOTICE '✅ Returns table enhanced with refund fields!';
        ELSE
          RAISE NOTICE '✅ Returns table already enhanced!';
        END IF;
      END $$;
    `);
    
    // Approve all existing unapproved reviews
    await pool.query(`UPDATE reviews SET is_approved = true WHERE is_approved = false`);
    
    console.log('✅ All migrations completed successfully!');
  } catch (err) {
    console.error('⚠️ Migration error:', err.message);
  }
}

// ==================== TEST ROUTES ====================

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🛍️ MyMart API Running!',
    version: '1.0.0',
    status: 'Server is working',
    timestamp: new Date()
  });
});

// Database test - IMPROVED
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    res.json({ 
      success: true,
      message: '✅ Database connected successfully!',
      data: {
        timestamp: result.rows[0].current_time,
        database_version: result.rows[0].db_version
      },
      database: 'Supabase PostgreSQL'
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      message: error.message,
      hint: 'Check your .env file and internet connection'
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DEBUG: Count vendors and stores
app.get('/api/debug/stats', async (req, res) => {
  try {
    const vendorCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'vendor'");
    const customerCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const adminCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const storeCount = await pool.query('SELECT COUNT(*) as count FROM stores');
    const productCount = await pool.query('SELECT COUNT(*) as count FROM products');
    const categoryCount = await pool.query('SELECT COUNT(*) as count FROM categories');
    
    // Get all stores with vendor info
    const stores = await pool.query(`
      SELECT s.id, s.store_name, s.store_slug, s.is_active, s.is_verified, s.created_at,
             u.id as owner_id, u.email, u.first_name, u.last_name
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `);
    
    // Get vendor details (corrected query)
    const vendors = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, 
             s.id as store_id, s.store_name, s.is_active, s.is_verified
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id
      WHERE u.role = 'vendor'
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      stats: {
        vendors: parseInt(vendorCount.rows[0].count),
        customers: parseInt(customerCount.rows[0].count),
        admins: parseInt(adminCount.rows[0].count),
        stores: parseInt(storeCount.rows[0].count),
        products: parseInt(productCount.rows[0].count),
        categories: parseInt(categoryCount.rows[0].count)
      },
      stores: rows,
      vendors: vendors.rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DEBUG: Approve store (for development)
app.post('/api/debug/approve-store/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE stores SET is_active = true, is_verified = true, verified_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    res.json({
      success: true,
      message: '✅ Store approved!',
      store: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Approve vendor account (for development)
app.post('/api/debug/approve-vendor/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(
      `UPDATE users SET is_active = true
       WHERE email = $1 AND role = 'vendor' RETURNING id, email, is_active`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    res.json({
      success: true,
      message: `✅ Vendor ${email} approved!`,
      vendor: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Get all pending vendors
app.get('/api/debug/pending-vendors', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, created_at, is_active 
       FROM users WHERE role = 'vendor' ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      vendors: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Reset vendor password
app.post('/api/debug/reset-vendor-password/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const bcrypt = require('bcryptjs');
    const newPassword = 'vendor123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2 AND role = 'vendor' RETURNING id, email`,
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    
    res.json({
      success: true,
      message: `✅ Password reset to: ${newPassword}`,
      vendor: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: Get all products (for testing)
app.get('/api/debug/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.price, p.stock_quantity, p.is_active, p.created_at,
             s.name as store_name, c.name as category_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});



// ==================== AUTH ROUTES ====================
// Existing auth routes (for password-based login)
app.use('/api/auth', authRoutes);
// Supabase Auth routes (for OTP-based login)
app.use('/api/supabase-auth', supabaseAuthRoutes);

// Wi-Fi voucher marketplace, owner network registration, wallet and admin review
app.use('/api/wifi-vouchers', wifiVoucherRoutes);

// ==================== STORE ROUTES ====================
app.use('/api/stores', storeRoutes);

// ==================== CATEGORY ROUTES ====================
app.use('/api/categories', categoryRoutes);

// ==================== BANNER ROUTES ====================
app.use('/api/banners', bannerRoutes);

// ==================== PRODUCT ROUTES ====================
app.use('/api/products', productRoutes);

// ==================== CART ROUTES ====================
app.use('/api/cart', cartRoutes);

// ==================== ORDER ROUTES ====================
app.use('/api/orders', orderRoutes);

// ==================== REVIEW ROUTES ====================
app.use('/api/reviews', reviewRoutes);

// ==================== PAYMENT ROUTES ====================
app.use('/api/payments', paymentRoutes);

// ==================== WISHLIST ROUTES ====================
app.use('/api/wishlist', wishlistRoutes);

// ==================== RETURN ROUTES ====================
app.use('/api/returns', returnRoutes);

// ==================== DISPUTE ROUTES ====================
app.use('/api/disputes', disputeRoutes);

// ==================== SHIPPING ROUTES ====================
app.use('/api/shipping', shippingRoutes);

// ==================== NOTIFICATION ROUTES ====================
app.use('/api/notifications', notificationRoutes);

// ==================== COUPON ROUTES (PHASE 7) ====================
app.use('/api/coupons', couponRoutes);

// ==================== VENDOR DASHBOARD ROUTES (PHASE 9) ====================
app.use('/api/vendor/dashboard', vendorDashboardRoutes);

// ==================== VENDOR COUPON ROUTES ====================
app.use('/api/vendor/coupons', vendorCouponRoutes);

// ==================== SEARCH ROUTES (PHASE 10) ====================
app.use('/api/search', searchRoutes);

// ==================== ADMIN STORE ROUTES ====================
app.use('/api/admin/store', adminStoreRoutes);

// ==================== ADMIN DASHBOARD ROUTES (PHASE 12) ====================
app.use('/api/admin', adminDashboardRoutes);

// ==================== ADMIN ORDERS ROUTES ====================
app.use('/api/admin/orders', adminOrdersRoutes);

// ==================== STRIPE PAYMENT ROUTES (PHASE 14) ====================
app.use('/api/stripe', stripePaymentRoutes);

// ==================== SETTLEMENT & COMMISSION ROUTES (PHASE 15) ====================
app.use('/api/settlements', settlementRoutes);

// ==================== STAFF MANAGEMENT ROUTES (PHASE 16) ====================
app.use('/api/staff', staffRoutes);

// ==================== BULK OPERATIONS ROUTES (PHASE 17) ====================
app.use('/api/bulk', bulkRoutes);

// ==================== STORAGE ROUTES ====================
app.use('/api/storage', storageRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: 'Server error',
    message: err.message
  });
});

// ==================== SERVER START ====================
async function startServer() {
  await runMigrations();
  
  // Fix image column size
  try {
    await pool.query('ALTER TABLE products ALTER COLUMN image_url TYPE TEXT');
    await pool.query('ALTER TABLE products ALTER COLUMN thumbnail TYPE TEXT');
    console.log('✅ Fixed image columns');
  } catch (e) { /* ignore if already fixed */ }
  
  // Fix existing delivered COD orders (set payment as received)
  try {
    const fixResult = await pool.query(
      "UPDATE orders SET payment_status = 'paid' WHERE status = 'delivered' AND payment_method = 'cod' AND payment_status = 'pending'"
    );
    if (fixResult.rowCount > 0) {
      console.log(`✅ Fixed ${fixResult.rowCount} existing delivered COD orders`);
    }
  } catch (e) { /* ignore if column doesn't exist yet */ }
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     🛍️  MYMART - MARKETPLACE API SERVER          ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ✅ Server Status: RUNNING                        ║
║  🌐 URL: http://localhost:${PORT}                 ║
║  📊 Database: Supabase PostgreSQL                ║
║  🔌 Environment: ${process.env.NODE_ENV || 'development'}      ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║  📍 AVAILABLE ENDPOINTS:                          ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  🧪 TEST ROUTES:                                  ║
║  GET   /                    - Server status       ║
║  GET   /api/test-db         - Database test       ║
║  GET   /api/users           - All users           ║
║  GET   /api/products        - All products        ║
║  GET   /api/stores          - All stores          ║
║                                                   ║
║  👤 AUTH ROUTES:                                  ║
║  POST  /api/auth/register   - Register user      ║
║  POST  /api/auth/login      - Login user         ║
║  GET   /api/auth/profile    - Get profile        ║
║  PUT   /api/auth/profile    - Update profile     ║
║  PUT   /api/auth/change-password - Change pwd    ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║  📦 NEW PHASE 4 ROUTES:                            ║
║  POST  /api/wishlist        - Add to wishlist    ║
║  GET   /api/wishlist         - Get wishlist       ║
║  POST  /api/returns          - Create return       ║
║  GET   /api/returns/my       - My returns          ║
║  POST  /api/disputes         - Create dispute      ║
║  POST  /api/shipping         - Create shipment     ║
║  GET   /api/shipping/:id     - Track shipment      ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║  🧪 Quick Test:                                   ║
║  Browser: http://localhost:${PORT}/               ║
║  Database: http://localhost:${PORT}/api/test-db  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  });
}

startServer();

// Keep server alive
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});

console.log('📡 Server is running. Press Ctrl+C to stop.');
