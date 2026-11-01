/**
 * MyMart Seed Only Script - Seeds data without creating tables
 * Run: node src/seed-only.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 MyMart Data Seeding...\n');

  try {
    // Never create/reset a privileged account with a hard-coded password.
    const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@mymart.com').trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;
    if (!configuredAdminPassword || configuredAdminPassword.length < 12) {
      throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters before seeding.');
    }
    console.log('👤 Creating users...');
    const adminPassword = await bcrypt.hash(configuredAdminPassword, 12);
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, 'admin', true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, first_name = $3, last_name = $4, role = 'admin', is_active = true, email_verified = true, updated_at = NOW()
    `, [adminEmail, adminPassword, process.env.ADMIN_FIRST_NAME || 'Platform', process.env.ADMIN_LAST_NAME || 'Administrator']);
    console.log(`  ✅ Admin configured: ${adminEmail} (password not printed)`);

    const customerPassword = await bcrypt.hash('customer123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
    `, ['demo@mymart.com', customerPassword, 'Demo', 'Customer', 'customer']);
    console.log('  ✅ Demo: demo@mymart.com / customer123');

    // Get admin ID
    const adminResult = await pool.query("SELECT id FROM users WHERE email = $1 AND role = 'admin' AND is_active = true", [adminEmail]);
    const adminId = adminResult.rows[0]?.id;
    if (!adminId) throw new Error('Admin user not found');

    // Seed Store
    console.log('\n🏪 Creating store...');
    await pool.query(`
      INSERT INTO stores (owner_id, store_name, store_slug, description, is_active, is_verified)
      VALUES ($1, $2, $3, $4, true, true)
      ON CONFLICT DO NOTHING
    `, [adminId, 'MyMart Official', 'mymart-official', 'Official MyMart Store']);
    console.log('  ✅ Store created');

    // Get store ID
    const storeResult = await pool.query("SELECT id FROM stores WHERE owner_id = $1", [adminId]);
    const storeId = storeResult.rows[0]?.id;
    if (!storeId) throw new Error('Store not found');

    // Seed Categories
    console.log('\n📁 Creating categories...');
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Phones, Laptops, Gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion & Apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Furniture & Decor' },
      { name: 'Sports', slug: 'sports', description: 'Fitness & Outdoor' },
      { name: 'Books', slug: 'books', description: 'Books & Media' },
      { name: 'Beauty', slug: 'beauty', description: 'Beauty & Personal Care' },
    ];

    for (const cat of categories) {
      await pool.query(`
        INSERT INTO categories (name, slug, description, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (slug) DO UPDATE SET description = $3
      `, [cat.name, cat.slug, cat.description]);
      console.log(`  ✅ ${cat.name}`);
    }

    // Get category IDs
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach(r => catMap[r.slug] = r.id);

    // Seed Products
    console.log('\n📦 Creating products...');
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

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const slug = prod.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const sku = 'MM-' + (i + 1).toString().padStart(4, '0');
      const discountPrice = prod.price - (prod.price * prod.discount / 100);
      
      // Check if product exists
      const existing = await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
      
      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO products (store_id, category_id, name, slug, sku, brand, base_price, discount_percentage, discount_price, stock_quantity, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 50, true)
        `, [storeId, catMap[prod.category], prod.name, slug, sku, prod.brand, prod.price, prod.discount, discountPrice]);
      } else {
        await pool.query(`
          UPDATE products SET discount_percentage = $1, discount_price = $2, base_price = $3
          WHERE slug = $4
        `, [prod.discount, discountPrice, prod.price, slug]);
      }
      console.log(`  ✅ ${prod.name}`);
    }

    console.log('\n🎉 MyMart Data Seeded Successfully!\n');
    console.log('=================================');
    console.log(`📋 Admin login email: ${adminEmail}`);
    console.log('   Use the password supplied via ADMIN_PASSWORD (not printed).');
    console.log('   Demo: demo@mymart.com / customer123 (development only)');
    console.log('');
    console.log('🌐 Now start backend: node server.js');
    console.log('📱 Then start frontend: npm start');
    console.log('=================================\n');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
