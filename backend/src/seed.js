/**
 * MyMart Database Seed Script
 * Run: node src/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@mymart.com').trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;
    if (!configuredAdminPassword || configuredAdminPassword.length < 12) {
      throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters before seeding.');
    }

    // 1. Create Categories
    console.log('📁 Creating categories...');
    const categories = [
      { id: uuidv4(), name: 'Electronics', slug: 'electronics', icon: '📱', color: '#E3F2FD', description: 'Phones, Laptops, Gadgets' },
      { id: uuidv4(), name: 'Clothing', slug: 'clothing', icon: '👕', color: '#FCE4EC', description: 'Fashion & Apparel' },
      { id: uuidv4(), name: 'Home & Garden', slug: 'home-garden', icon: '🏠', color: '#E8F5E9', description: 'Furniture & Decor' },
      { id: uuidv4(), name: 'Sports', slug: 'sports', icon: '⚽', color: '#FFF3E0', description: 'Fitness & Outdoor' },
      { id: uuidv4(), name: 'Books', slug: 'books', icon: '📚', color: '#F3E5F5', description: 'Books & Media' },
      { id: uuidv4(), name: 'Beauty', slug: 'beauty', icon: '💄', color: '#FFEBEE', description: 'Beauty & Personal Care' },
    ];

    for (const cat of categories) {
      try {
        await pool.query(
          `INSERT INTO categories (id, name, slug, icon, color, description, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (slug) DO UPDATE SET icon = $4, color = $5, description = $6`,
          [cat.id, cat.name, cat.slug, cat.icon, cat.color, cat.description]
        );
        console.log(`  ✅ ${cat.name}`);
      } catch (e) {
        console.log(`  ⚠️  ${cat.name}: ${e.message}`);
      }
    }

    // 2. Create Admin User
    console.log('\n👤 Creating admin user...');
    const adminPassword = await bcrypt.hash(configuredAdminPassword, 12);
    let adminId;
    try {
      const adminResult = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'admin', true, true)
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = 'admin', is_active = true, email_verified = true, updated_at = NOW()
         RETURNING id`,
        [uuidv4(), adminEmail, adminPassword, process.env.ADMIN_FIRST_NAME || 'Platform', process.env.ADMIN_LAST_NAME || 'Administrator']
      );
      adminId = adminResult.rows[0].id;
      console.log(`  ✅ Admin configured: ${adminEmail} (password not printed)`);
    } catch (e) {
      console.log(`  ⚠️  Admin: ${e.message}`);
    }

    // 3. Create Demo Store
    console.log('\n🏪 Creating demo store...');
    const storeId = uuidv4();
    try {
      await pool.query(
        `INSERT INTO stores (id, owner_id, store_name, slug, description, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO NOTHING`,
        [storeId, adminId, 'MyMart Official', 'mymart-official', 'Official MyMart Store']
      );
      console.log('  ✅ Store created');
    } catch (e) {
      console.log(`  ⚠️  Store: ${e.message}`);
    }

    // 4. Create Sample Products
    console.log('\n📦 Creating sample products...');
    const products = [
      { name: 'Wireless Bluetooth Headphones', price: 79.99, discount: 20, brand: 'SoundMax', category: 'Electronics' },
      { name: 'Smart Watch Series 5', price: 199.99, discount: 15, brand: 'TechWear', category: 'Electronics' },
      { name: 'Running Shoes Pro', price: 89.99, discount: 25, brand: 'SportX', category: 'Sports' },
      { name: 'Premium Laptop Stand', price: 49.99, discount: 10, brand: 'ErgoDesk', category: 'Electronics' },
      { name: 'Cotton T-Shirt Pack', price: 39.99, discount: 30, brand: 'FashionHub', category: 'Clothing' },
      { name: 'Yoga Mat Premium', price: 29.99, discount: 15, brand: 'FlexFit', category: 'Sports' },
      { name: 'LED Desk Lamp', price: 34.99, discount: 20, brand: 'BrightLight', category: 'Home & Garden' },
      { name: 'Coffee Maker Deluxe', price: 89.99, discount: 25, brand: 'BrewMaster', category: 'Home & Garden' },
    ];

    const catResult = await pool.query('SELECT id, name FROM categories WHERE is_active = true');
    const catMap = {};
    catResult.rows.forEach(c => catMap[c.name] = c.id);

    for (const prod of products) {
      try {
        const prodId = uuidv4();
        const discountPrice = prod.price - (prod.price * prod.discount / 100);
        await pool.query(
          `INSERT INTO products (id, store_id, name, slug, description, brand, base_price, discount_percentage, discount_price, category_id, stock_quantity, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
           ON CONFLICT DO NOTHING`,
          [prodId, storeId, prod.name, prod.name.toLowerCase().replace(/\s+/g, '-'), 
           `High quality ${prod.name.toLowerCase()} from ${prod.brand}`, prod.brand,
           prod.price, prod.discount, discountPrice, catMap[prod.category], 50]
        );
        console.log(`  ✅ ${prod.name}`);
      } catch (e) {
        console.log(`  ⚠️  ${prod.name}: ${e.message}`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`\n📋 Admin login email: ${adminEmail}`);
    console.log('   Use the password supplied via ADMIN_PASSWORD (not printed).');
    console.log('\n🌐 Backend URL: http://localhost:5000');
    console.log('📱 Frontend: Run "npm start" in frontend folder\n');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
