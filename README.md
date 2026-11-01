# 🛒 MyMart - Complete Multi-Vendor E-commerce Platform

> **Wi-Fi voucher Phase 1 note:** This repository now includes the initial Wi-Fi network registration, owner-only “معرض شبكاتي”, admin review, voucher inventory/purchase endpoints, encrypted voucher storage, wallet ledger, and a fixed 0% platform commission policy. Before deployment, follow `backend/PHASE1_WIFI_SETUP.md`, apply migrations to a backed-up staging database, and set secrets privately. Do not treat the project as production-ready until the Flutter APK/dashboard are built and integration-tested on a real device and database.


A fully-featured, production-ready multi-vendor e-commerce platform built with Flutter, Node.js, and PostgreSQL. Includes mobile app, admin dashboard, and vendor dashboard.

**Live Demo:** `http://10.194.228.114:5000` | **Status:** ✅ Complete & Functional

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Deployment Guide](#-deployment-guide)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Features](#-features)
- [Known Issues & Fixes](#-known-issues--fixes)
- [Security](#-security-considerations)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

MyMart is a complete multi-vendor e-commerce solution with three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MyMart Architecture                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │  Flutter     │     │   Admin      │     │   Vendor     │   │
│   │  Mobile App  │     │   Dashboard  │     │   Dashboard  │   │
│   │ (Android/iOS)│     │  (HTML/CSS)  │     │  (HTML/CSS)  │   │
│   └──────┬───────┘     └──────┬───────┘     └──────┬───────┘   │
│          │                     │                     │           │
│          └─────────────────┬──────────────────────┘           │
│                            │                                   │
│                            ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │           Backend API (Node.js + Express)               │ │
│   │                   Port: 5000                            │ │
│   └──────────────────────┬────────────────────────────────┬┘ │
│                          │                                │   │
│        ┌─────────────────┘                                │   │
│        │                                                  │   │
│        ▼                                                  ▼   │
│   ┌──────────────────┐                          ┌─────────────┐
│   │ PostgreSQL DB    │                          │ Supabase    │
│   │  (Supabase)      │                          │ Storage     │
│   └──────────────────┘                          └─────────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Mobile App** | Flutter + Provider | Latest |
| **Web Dashboards** | HTML5 + CSS3 + JavaScript | ES6+ |
| **Backend** | Node.js + Express.js | v18+ |
| **Database** | PostgreSQL | Via Supabase |
| **Authentication** | JWT + bcrypt | |
| **File Storage** | Supabase Storage | |
| **Email Service** | SendGrid | |
| **SMS Service** | Twilio | |
| **Payments** | Stripe | |

---

## 🏗️ Project Structure

```
D:\Mymart\
│
├── 📱 mymart_app/                    # Flutter Mobile Application
│   ├── lib/
│   │   ├── config/                  # API URLs, theme config
│   │   ├── models/                  # Data models
│   │   ├── providers/               # State management (Provider)
│   │   ├── screens/                 # UI Screens
│   │   ├── services/                # API services
│   │   └── widgets/                 # Reusable components
│   │
│   └── assets/images/               # Local images
│
├── 🌐 admin_dashboard/              # Admin Dashboard (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── 🛍️ vendor_dashboard/             # Vendor Dashboard (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── ⚙️ backend/                       # Node.js Backend API
│   ├── src/
│   │   ├── config/                  # Database & Supabase config
│   │   ├── controllers/             # Business logic
│   │   ├── middleware/              # Authentication & Authorization
│   │   ├── routes/                  # API route definitions
│   │   ├── models/                  # Database models
│   │   └── services/                # Email, SMS, Payment services
│   │
│   ├── server.js                    # Main entry point
│   ├── setup-admin.js               # Admin user setup
│   └── package.json
│
└── 📦 database/                     # Migrations & SQL schemas
```

---

## 🔗 System Architecture

### Multi-Vendor Flow

```
1️⃣ VENDOR REGISTRATION
   └─> Vendor fills form on Dashboard
   └─> POST /api/auth/register (role: vendor)
   └─> OTP verification via email
   └─> Store created (pending admin approval)

2️⃣ ADMIN APPROVAL
   └─> Admin views pending vendors
   └─> PUT /api/admin/vendors/:id/approve
   └─> Store is_verified = true

3️⃣ VENDOR SETUP
   └─> Vendor logs in
   └─> Adds products via dashboard
   └─> Products appear in mobile app

4️⃣ CUSTOMER ORDER
   └─> Browse stores in Flutter app
   └─> Add to cart & checkout
   └─> POST /api/orders

5️⃣ ORDER FULFILLMENT
   └─> Vendor sees order in dashboard
   └─> Updates status: Pending → Confirmed → Shipped → Delivered
   └─> Customer receives notification

6️⃣ ADMIN MONITORING
   └─> Tracks all orders, revenue, vendors
   └─> Manages users, products, categories, coupons
```

### API Connection Flow

```
Frontend                          Backend                      Database
  │                                  │                           │
  ├─ Flutter App ────────────────────┤                          │
  │  (http://IP:5000)                ├── REST API Calls────────┤
  ├─ Admin Dashboard ────────────────┤                          │
  │  (http://IP:5000)                │  ┌─ Authentication      │
  │                                   │  ├─ Product Mgmt        │
  └─ Vendor Dashboard ───────────────┤  ├─ Order Mgmt          │
     (http://IP:5000)                │  ├─ Store Mgmt          │
                                      │  └─ User Mgmt          │
                                      │                        │
                                      ▼                        │
                              Express.js Server              │
                              (Port 5000)                    │
                                      │                      │
                                      └──────────────────────┤
                                                             │
                                                    PostgreSQL / Supabase
                                                    Storage & Database
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Flutter** latest
- **PostgreSQL** (or Supabase account)
- **Git**

### Quick Start

#### 1. Backend Setup

```bash
# Clone and navigate
git clone https://github.com/Rehman6112006/MyMart-App-Full-Project.git
cd MyMart-App-Full-Project/backend

# Install dependencies
npm install

# Create .env file and set private values (do not commit this file)
# Include DATABASE_URL, a random JWT_SECRET (32+ characters), and:
ADMIN_EMAIL=admin@mymart.com
ADMIN_PASSWORD=choose-a-unique-password-at-least-12-characters
PORT=5000
NODE_ENV=development

# Create/reset admin using the password set privately in backend/.env
node setup-admin.js
# The script prints the admin email and role only; it never prints the password.

# Start server
npm start
# Server running on: http://localhost:5000
```

#### 2. Flutter App Setup

```bash
cd ../mymart_app

# Update API URL (lib/config/api_config.dart)
# Change: static const String baseUrl = 'http://YOUR_SERVER_IP:5000';

# Get dependencies
flutter pub get

# Run app
flutter run

# Build release APK
flutter build apk --release
```

#### 3. Admin Dashboard

```bash
# Simple - just open in browser:
cd ../admin_dashboard
# Double-click: index.html

# OR serve locally:
python -m http.server 8080 --directory .
# Open: http://localhost:8080
```

#### 4. Vendor Dashboard

```bash
cd ../vendor_dashboard
# Same as admin dashboard - just open index.html
```

---

## 📝 Deployment Guide

### Option 1: Local Network (Development)

```bash
# Backend
cd backend
npm start
# Server: http://192.168.1.x:5000

# Update all frontends with your IP:
# - Flutter: lib/config/api_config.dart
# - Admin: js/config.js
# - Vendor: js/config.js

# Open dashboards:
# - Admin: file:///path/to/admin_dashboard/index.html
# - Vendor: file:///path/to/vendor_dashboard/index.html
```

### Option 2: Production Deployment

#### Backend (Heroku/Railway/Render)

```bash
# Using Railway.app (recommended)
1. Push to GitHub
2. Connect repository
3. Set environment variables
4. Deploy

# Using Heroku
heroku login
heroku create mymart-backend
git push heroku main
heroku config:set DATABASE_URL=your_url
heroku ps:scale web=1
```

#### Frontend Dashboards (Netlify/Vercel/GitHub Pages)

```bash
# Netlify
1. Drag & drop admin_dashboard folder
2. Set custom domain
3. Done!

# GitHub Pages
1. Push to gh-pages branch
2. Enable in repository settings
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register              Register user/vendor
POST   /api/auth/login                 Login user
POST   /api/auth/logout                Logout
POST   /api/supabase-auth/send-otp     Send OTP to email
POST   /api/supabase-auth/verify-otp   Verify OTP & create account
```

### Products
```
GET    /api/products                   List all products
GET    /api/products/featured          Featured products
GET    /api/products/:id               Product details
POST   /api/products                   Create product (vendor)
PUT    /api/products/:id               Update product (vendor)
DELETE /api/products/:id               Delete product (vendor)
```

### Stores
```
GET    /api/stores                     List all stores
GET    /api/stores/:id                 Store details
GET    /api/stores/:id/products        Store's products
POST   /api/stores                     Create store (vendor)
PUT    /api/stores/:id                 Update store (vendor)
```

### Orders
```
GET    /api/orders                     All orders (admin)
GET    /api/orders/my                  My orders (customer)
POST   /api/orders                     Create order
PUT    /api/orders/:id/status          Update order status
GET    /api/orders/:id                 Order details
```

### Cart
```
GET    /api/cart                       Get user's cart
POST   /api/cart/items                 Add to cart
PUT    /api/cart/items/:id             Update cart item
DELETE /api/cart/items/:id             Remove from cart
```

### Categories
```
GET    /api/categories                 List categories
POST   /api/categories                 Create category (admin)
PUT    /api/categories/:id             Update category (admin)
DELETE /api/categories/:id             Delete category (admin)
```

### Coupons
```
GET    /api/coupons                    List coupons
POST   /api/coupons                    Create coupon (admin)
PUT    /api/coupons/:id                Update coupon (admin)
DELETE /api/coupons/:id                Delete coupon (admin)
POST   /api/coupons/validate           Validate coupon code
```

### Admin Only
```
GET    /api/admin/dashboard/stats      Dashboard statistics
GET    /api/admin/vendors              All vendors list
PUT    /api/admin/vendors/:id/approve  Approve vendor
DELETE /api/admin/vendors/:id          Remove vendor
GET    /api/admin/users                All users
```

### Vendor Only
```
GET    /api/vendor/dashboard/stats     Vendor statistics
GET    /api/vendor/orders              Vendor's orders
GET    /api/vendor/products            Vendor's products
GET    /api/settlements/vendor/wallet  Vendor wallet/earnings
```

---

## 🗄️ Database Schema

### Key Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',  -- customer, vendor, admin
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Stores Table
```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,  -- Admin approval
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id),
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, confirmed, shipped, delivered
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Database Relationships
```
users (1)──────────< (N) stores
          └────────< (N) orders

stores (1)────────< (N) products

categories (1)───< (N) products

orders (1)──────< (N) order_items
        └─────< (1) users

users (1)────────< (N) carts
carts (1)──────< (N) cart_items
```

---

## ✨ Features

### ✅ Completed Features

| Feature | Status | Details |
|---------|--------|---------|
| **User Authentication** | ✅ Done | JWT + OTP verification |
| **Multi-Vendor Support** | ✅ Done | Multiple stores, vendor approval |
| **Product Management** | ✅ Done | CRUD with image upload |
| **Store Management** | ✅ Done | Vendor store setup & management |
| **Shopping Cart** | ✅ Done | Add/update/remove items |
| **Order Management** | ✅ Done | Complete order lifecycle |
| **Admin Dashboard** | ✅ Done | Full admin functionality |
| **Vendor Dashboard** | ✅ Done | Vendor order & product management |
| **Mobile App** | ✅ Done | Full Flutter application |
| **Category System** | ✅ Done | Product categories |
| **Coupon/Discount** | ✅ Done | Coupon validation |
| **Payment Integration** | ✅ Done | Stripe basic setup |
| **Image Storage** | ✅ Done | Supabase Storage |
| **Email Notifications** | ✅ Done | SendGrid integration |

### 🔄 In Progress / Roadmap

| Feature | Priority | Status |
|---------|----------|--------|
| Real-time Notifications | Medium | Planned |
| Push Notifications (FCM) | Medium | Planned |
| Analytics Dashboard | Medium | Basic |
| Advanced Reports | Low | Basic |
| Admin Settings | Medium | Partial |
| SMS Notifications | Low | API ready |
| Two-Factor Auth | High | Planned |

---

## 🐛 Known Issues & Fixes

### ✅ Fixed Issues

#### 1. Image Upload Functionality
```javascript
// Status: FIXED ✅
// Added drag-and-drop image upload
// Implemented in Admin and Vendor dashboards
// Supports: PNG, JPG, GIF, WebP
```

#### 2. IP Address Configuration
```javascript
// Status: FIXED ✅
// Current server: http://10.194.228.114:5000
// All dashboards configured with correct IP
// Flutter app: Update in api_config.dart
```

#### 3. Image Error Handling
```dart
// Status: FIXED ✅
// Added NetworkImageWithError widget
// Handles loading/error states gracefully
// Shows placeholder on network error
```

#### 4. CORS Configuration
```javascript
// Status: FIXED ✅
// CORS enabled in server.js
// Allow all origins in development
// Restrict in production
```

#### 5. Password Validation
```javascript
// Status: FIXED ✅
// Minimum 6 characters
// Strength validation implemented
// Validator middleware active
```

---

## 🎮 Testing Complete Flow

### Step-by-Step Test Guide

#### 1. Start Backend
```bash
cd backend
npm start
# Wait for: "Server running on port 5000"
```

#### 2. Create Admin Account
```bash
cd backend
# First set ADMIN_EMAIL and a unique ADMIN_PASSWORD (12+ characters) in backend/.env.
node setup-admin.js
# Login with the configured admin email and the password you set privately.
```

#### 3. Open Admin Dashboard
```
URL: http://localhost:8080 (or file:///path/admin_dashboard/index.html)
```

#### 4. Open Vendor Dashboard
```
URL: http://localhost:8081 (or file:///path/vendor_dashboard/index.html)
```

#### 5. Register as Vendor
```
1. Open Vendor Dashboard
2. Click "Register"
3. Fill: Store Name, Email, Password
4. Verify OTP from email
5. Wait for admin approval
```

#### 6. Admin Approves Vendor
```
1. Open Admin Dashboard
2. Go to "Vendors"
3. Find pending vendor
4. Click "Approve"
```

#### 7. Vendor Adds Products
```
1. Vendor logs in
2. Go to "Products"
3. Click "Add Product"
4. Fill details + upload image
5. Save
```

#### 8. Customer Browses & Orders
```
1. Open Flutter app
2. Browse stores
3. View vendor products
4. Add to cart
5. Checkout & place order
```

#### 9. Vendor Manages Order
```
1. Vendor sees new order
2. Updates status
3. Customer gets notification
```

#### 10. Admin Monitors
```
1. Admin sees all orders/vendors
2. Checks statistics
3. Manages users
```

---

## 🖼️ Image Storage (Supabase)

### Storage Buckets

```
Supabase Project
├── 🖼️ product-images/
│   ├── public access
│   ├── Authenticated upload
│   └── Formula: /productId/timestamp-filename
│
├── 🏪 store-logos/
│   ├── public access
│   ├── Authenticated upload
│   └── Formula: /storeId/logo.png
│
└── 👤 user-avatars/
    ├── Public read
    └── Owner write only
```

### Upload Example

```javascript
// Frontend: Upload to Supabase Storage
async function uploadImage(file, folder, id) {
    const fileName = `${id}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
        .from(folder)  // e.g., 'product-images'
        .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(folder)
        .getPublicUrl(fileName);
    
    return publicUrl;
}

// Backend: Save URL to database
await db.products.create({
    name: 'Product',
    price: 99.99,
    image_url: publicUrl  // Supabase URL
});
```

---

## 🔐 Security Considerations

### Current Implementation ✅
- JWT-based authentication
- bcrypt password hashing
- Role-based access control (RBAC)
- Protected API routes with middleware
- Rate limiting (100/15min general, 20/15min auth)
- Input validation & sanitization
- Request body size limit (10MB)
- CORS configured

### Production Recommendations ⚠️
- [ ] Enable HTTPS/SSL certificates
- [ ] Add CSRF protection
- [ ] Implement 2FA for admin
- [ ] Add request sanitization for SQL injection
- [ ] Use environment variables for secrets
- [ ] Enable database encryption
- [ ] Set up backup & disaster recovery
- [ ] Implement audit logging
- [ ] Use Web Application Firewall (WAF)

---

## 🐛 Troubleshooting

### Backend Issues

**Q: "Cannot find module" error**
```bash
# Solution:
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Q: Database connection failed**
```bash
# Solution:
1. Check DATABASE_URL in .env
2. Verify Supabase project is active
3. Test connection: psql "your_connection_string"
```

**Q: Port 5000 already in use**
```bash
# Solution (macOS/Linux):
lsof -i :5000
kill -9 <PID>

# Solution (Windows):
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**Q: Login not working**
```
Checklist:
✓ Backend is running on correct port
✓ API URL matches backend (http://IP:5000)
✓ Browser console shows no CORS errors
✓ Network tab shows successful requests
```

**Q: Admin login fails**
```bash
# Solution:
cd backend
node setup-admin.js  # Recreate admin user
```

**Q: Products not showing**
```
Checklist:
✓ Products have is_active = true
✓ Vendor store has is_verified = true
✓ Product belongs to active vendor
✓ API returns 200 status
```

**Q: Images not loading**
```
Checklist:
✓ Supabase Storage bucket exists
✓ Public read access enabled
✓ Image URLs are correct
✓ Image file exists in bucket
✓ Network tab: no 404 errors
```

### Flutter Issues

**Q: Flutter app can't connect to backend**
```dart
// Check in lib/config/api_config.dart:
static const String baseUrl = 'http://YOUR_ACTUAL_IP:5000';

// NOT localhost, NOT 127.0.0.1
// Use actual network IP: 192.168.x.x or 10.x.x.x
```

**Q: App crashes on startup**
```bash
# Solution:
flutter clean
flutter pub get
flutter run -v  # Verbose output for debugging
```

---

## 📞 Support & Documentation

- **Backend API Docs:** [Postman Collection](docs/api.postman_collection.json)
- **Flutter Documentation:** [Flutter Docs](https://flutter.dev/docs)
- **Supabase Guide:** [Supabase Docs](https://supabase.com/docs)
- **Express.js Reference:** [Express Docs](https://expressjs.com/)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary software for **MyMart E-commerce Platform**.
Unauthorized copying or distribution is prohibited.

© 2026 MyMart. All rights reserved.

---

## 👨‍💻 Author

**Rehman**
- GitHub: [@Rehman6112006](https://github.com/Rehman6112006)
- Project: [MyMart-App-Full-Project](https://github.com/Rehman6112006/MyMart-App-Full-Project)

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | 10,000+ |
| **Backend Endpoints** | 40+ |
| **Database Tables** | 12+ |
| **Flutter Screens** | 15+ |
| **Development Time** | 3+ months |
| **Status** | ✅ Production Ready |

**Last Updated:** May 30, 2026
