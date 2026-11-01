/**
 * MyMart Database Setup Script
 * Creates core tables and seeds initial data
 * Run: node src/setup.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('🔧 MyMart Database Setup\n');

  try {
    // Create core tables
    console.log('📋 Creating core tables...');
    
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        avatar_url TEXT,
        role VARCHAR(20) DEFAULT 'customer',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ users table');

    // 2. Stores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        store_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        verified BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0,
        total_products INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ stores table');

    // 3. Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(20),
        parent_id UUID REFERENCES categories(id),
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ categories table');

    // 4. Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        sku VARCHAR(100),
        brand VARCHAR(100),
        base_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_price DECIMAL(10,2),
        tax_percentage DECIMAL(5,2) DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        thumbnail TEXT,
        images JSONB DEFAULT '[]',
        condition VARCHAR(20) DEFAULT 'new',
        weight DECIMAL(8,2),
        dimensions JSONB,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ products table');

    // 5. Cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);
    console.log('  ✅ cart table');

    // 6. Orders table (updated with all order fields)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id),
        vendor_id UUID REFERENCES users(id),
        store_id UUID REFERENCES stores(id),
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_charge DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cod',
        payment_status VARCHAR(50) DEFAULT 'pending',
        status VARCHAR(50) DEFAULT 'pending',
        delivery_address_id UUID,
        delivery_slot_id UUID,
        delivery_date DATE,
        delivery_notes TEXT,
        shipping_address TEXT,
        cancellation_reason TEXT,
        cancelled_by UUID,
        delivery_person_id UUID,
        delivery_person_name VARCHAR(100),
        delivery_person_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ orders table');

    // Add missing columns to orders if they don't exist
    try {
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id UUID`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id UUID`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot_id UUID`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by UUID`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id UUID`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_name VARCHAR(100)`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_phone VARCHAR(20)`);
    } catch (e) {
      // Columns may already exist
    }

    // 7. Order Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        vendor_id UUID REFERENCES users(id),
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        commission_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Add missing columns if they don't exist
    try {
      await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT`);
    } catch (e) {
      // Column may already exist
    }
    console.log('  ✅ order_items table');

    // 8. Wishlists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(customer_id, product_id)
      )
    `);
    console.log('  ✅ wishlists table');

    // 9. Delivery Addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        landmark VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ delivery_addresses table');

    // 10. Cart Items table (replacing old cart table with better structure)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);
    // Rename column if exists with old name
    try {
      await pool.query(`ALTER TABLE cart_items RENAME COLUMN customer_id TO user_id`);
    } catch (e) {
      // Column may already be named user_id
    }
    console.log('  ✅ cart_items table');

    // 11. Delivery Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ delivery_settings table');

    // 12. Delivery Slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slot_name VARCHAR(100) NOT NULL,
        slot_type VARCHAR(50) DEFAULT 'regular',
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        extra_charge DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ delivery_slots table');

    // 13. Delivery Persons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        vehicle_number VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ delivery_persons table');

    // 14. Order Status History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        changed_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Add missing column if it doesn't exist
    try {
      await pool.query(`ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS updated_by UUID`);
    } catch (e) {
      // Column may already exist
    }
    console.log('  ✅ order_status_history table');

    // 15. Returns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
        customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        description TEXT,
        images TEXT DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'pending',
        refund_amount DECIMAL(10,2),
        admin_notes TEXT,
        vendor_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `);
    console.log('  ✅ returns table');

    console.log('\n🌱 Seeding initial data...\n');

    // Seed administrator only when an explicit, strong password is provided.
    // Never create or reset a privileged account to a hard-coded default.
    const configuredAdminEmail = String(process.env.ADMIN_EMAIL || 'admin@mymart.com').trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;
    let adminId = null;
    if (configuredAdminPassword) {
      if (configuredAdminPassword.length < 12) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters; no default admin password is allowed.');
      }
      const adminPasswordHash = await bcrypt.hash(configuredAdminPassword, 12);
      const adminResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, 'admin', true, true)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = 'admin', is_active = true, email_verified = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [configuredAdminEmail, adminPasswordHash, process.env.ADMIN_FIRST_NAME || 'Platform', process.env.ADMIN_LAST_NAME || 'Administrator']);
      adminId = adminResult.rows[0].id;
      console.log(`  ✅ Admin account configured: ${configuredAdminEmail} (password not printed)`);
    } else {
      const existingAdmin = await pool.query("SELECT id FROM users WHERE email = $1 AND role = 'admin' AND is_active = true", [configuredAdminEmail]);
      adminId = existingAdmin.rows[0]?.id || null;
      console.log(adminId ? `  ✅ Existing active admin retained: ${configuredAdminEmail}` : '  ⚠️ No admin seeded. Set ADMIN_PASSWORD and run node setup-admin.js to create one.');
    }

    // Seed Demo Customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customerId = 'c0000000-0000-0000-0000-000000000001';
    await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
    `, [customerId, 'demo@mymart.com', customerPassword, 'Demo', 'Customer', 'customer']);
    console.log('  ✅ Demo user: demo@mymart.com / customer123');

    // Seed Store
    const storeId = 's0000000-0000-0000-0000-000000000001';
    if (adminId) {
      await pool.query(`
        INSERT INTO stores (id, owner_id, store_name, store_slug, description, is_active, is_verified)
        VALUES ($1, $2, $3, $4, $5, true, true)
        ON CONFLICT DO NOTHING
      `, [storeId, adminId, 'MyMart Official', 'mymart-official', 'Official MyMart Store']);
      console.log('  ✅ Demo store created');
    } else {
      console.log('  ⚠️ Demo store skipped because no active administrator was configured.');
    }

    // Seed Delivery Settings
    const deliverySettings = [
      { key: 'base_delivery_charge', value: '3.00' },
      { key: 'free_delivery_threshold', value: '35' },
      { key: 'same_day_delivery_charge', value: '2.00' },
      { key: 'min_order_amount', value: '10' },
    ];
    for (const setting of deliverySettings) {
      await pool.query(`
        INSERT INTO delivery_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2
      `, [setting.key, setting.value]);
    }
    console.log('  ✅ Delivery settings seeded');

    // Seed Delivery Slots
    const deliverySlots = [
      { name: 'Morning', type: 'morning', start: '09:00', end: '12:00', charge: '0' },
      { name: 'Afternoon', type: 'afternoon', start: '12:00', end: '16:00', charge: '0' },
      { name: 'Evening', type: 'evening', start: '16:00', end: '20:00', charge: '1.99' },
    ];
    for (const slot of deliverySlots) {
      await pool.query(`
        INSERT INTO delivery_slots (slot_name, slot_type, start_time, end_time, extra_charge)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [slot.name, slot.type, slot.start, slot.end, slot.charge]);
    }
    console.log('  ✅ Delivery slots seeded');

    // Seed Categories
    const categories = [
      { name: 'Electronics', slug: 'electronics', icon: '📱', color: '#E3F2FD', desc: 'Phones, Laptops, Gadgets' },
      { name: 'Clothing', slug: 'clothing', icon: '👕', color: '#FCE4EC', desc: 'Fashion & Apparel' },
      { name: 'Home & Garden', slug: 'home-garden', icon: '🏠', color: '#E8F5E9', desc: 'Furniture & Decor' },
      { name: 'Sports', slug: 'sports', icon: '⚽', color: '#FFF3E0', desc: 'Fitness & Outdoor' },
      { name: 'Books', slug: 'books', icon: '📚', color: '#F3E5F5', desc: 'Books & Media' },
      { name: 'Beauty', slug: 'beauty', icon: '💄', color: '#FFEBEE', desc: 'Beauty & Personal Care' },
    ];

    for (const cat of categories) {
      await pool.query(`
        INSERT INTO categories (name, slug, icon, color, description, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (slug) DO UPDATE SET icon = $3, color = $4
      `, [cat.name, cat.slug, cat.icon, cat.color, cat.desc]);
      console.log(`  ✅ Category: ${cat.name}`);
    }

    // Get category IDs
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach(r => catMap[r.slug] = r.id);

    // Seed Products
    const products = [
      { name: 'Wireless Bluetooth Headphones Pro', price: 79.99, discount: 20, brand: 'SoundMax', category: 'electronics' },
      { name: 'Smart Watch Series 5', price: 199.99, discount: 15, brand: 'TechWear', category: 'electronics' },
      { name: 'Running Shoes Pro', price: 89.99, discount: 25, brand: 'SportX', category: 'sports' },
      { name: 'Premium Laptop Stand', price: 49.99, discount: 10, brand: 'ErgoDesk', category: 'electronics' },
      { name: 'Cotton T-Shirt Pack (3)', price: 39.99, discount: 30, brand: 'FashionHub', category: 'clothing' },
      { name: 'Yoga Mat Premium', price: 29.99, discount: 15, brand: 'FlexFit', category: 'sports' },
      { name: 'LED Desk Lamp', price: 34.99, discount: 20, brand: 'BrightLight', category: 'home-garden' },
      { name: 'Coffee Maker Deluxe', price: 89.99, discount: 25, brand: 'BrewMaster', category: 'home-garden' },
      { name: 'Wireless Mouse', price: 24.99, discount: 15, brand: 'TechGear', category: 'electronics' },
      { name: 'Backpack Travel', price: 54.99, discount: 20, brand: 'TravelPro', category: 'sports' },
      { name: 'Jeans Slim Fit', price: 49.99, discount: 25, brand: 'DenimStyle', category: 'clothing' },
      { name: 'Face Moisturizer', price: 19.99, discount: 10, brand: 'GlowSkin', category: 'beauty' },
    ];

    for (const prod of products) {
      const slug = prod.name.toLowerCase().replace(/\s+/g, '-');
      const discountPrice = prod.price - (prod.price * prod.discount / 100);
      await pool.query(`
        INSERT INTO products (store_id, category_id, name, slug, brand, base_price, discount_percentage, discount_price, stock_quantity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 50, true)
        ON CONFLICT (slug) DO UPDATE SET discount_percentage = $7, discount_price = $8
      `, [storeId, catMap[prod.category], prod.name, slug, prod.brand, prod.price, prod.discount, discountPrice]);
      console.log(`  ✅ Product: ${prod.name}`);
    }

    console.log('\n🎉 MyMart Database Setup Complete!\n');
    console.log('=================================');
    console.log('📋 Admin login: use ADMIN_EMAIL and the password you supplied via ADMIN_PASSWORD.');
    console.log('   No default administrator password is created or displayed.');
    console.log('');
    console.log('🌐 Backend: http://localhost:5000');
    console.log('📱 Frontend: Run npm start in frontend folder');
    console.log('=================================\n');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
