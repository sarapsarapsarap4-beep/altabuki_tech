-- Login/registration compatibility: allow a username identifier while keeping legacy email-based accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username)) WHERE username IS NOT NULL AND username <> '';
CREATE INDEX IF NOT EXISTS idx_users_phone_login ON users (phone) WHERE phone IS NOT NULL AND phone <> '';

-- Phase 23: Wi-Fi voucher platform foundation (PostgreSQL)
-- Safe to re-run. Apply with the backend migration runner or psql after backup.

CREATE TABLE IF NOT EXISTS network_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(250) NOT NULL,
  business_activity VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  distributor_account_number VARCHAR(100),
  document_type VARCHAR(40) NOT NULL CHECK (document_type IN ('national_id','passport','family_card','commercial_registration')),
  document_front_url TEXT NOT NULL,
  document_back_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE CHECK (terms_accepted = TRUE),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id)
);

CREATE TABLE IF NOT EXISTS wifi_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  registration_id UUID UNIQUE REFERENCES network_registrations(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wifi_voucher_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES wifi_networks(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  denomination NUMERIC(12,2) NOT NULL CHECK (denomination >= 0),
  data_allowance VARCHAR(80),
  validity VARCHAR(80),
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(network_id, name)
);

CREATE TABLE IF NOT EXISTS wifi_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES wifi_voucher_categories(id) ON DELETE CASCADE,
  code_ciphertext TEXT NOT NULL,
  secret_ciphertext TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold','disabled')),
  sold_to UUID REFERENCES users(id),
  sold_at TIMESTAMPTZ,
  purchase_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'YER',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('test_credit','voucher_purchase','voucher_sale','refund','adjustment')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  balance_after NUMERIC(14,2) NOT NULL CHECK (balance_after >= 0),
  reference_id UUID,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wifi_voucher_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  network_id UUID NOT NULL REFERENCES wifi_networks(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES wifi_voucher_categories(id) ON DELETE RESTRICT,
  voucher_id UUID NOT NULL UNIQUE REFERENCES wifi_vouchers(id) ON DELETE RESTRICT,
  gross_amount NUMERIC(14,2) NOT NULL CHECK (gross_amount >= 0),
  platform_commission NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (platform_commission = 0),
  seller_amount NUMERIC(14,2) NOT NULL CHECK (seller_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='wifi_vouchers_purchase_fk') THEN
    ALTER TABLE wifi_vouchers ADD CONSTRAINT wifi_vouchers_purchase_fk
      FOREIGN KEY (purchase_id) REFERENCES wifi_voucher_purchases(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wifi_networks_owner ON wifi_networks(owner_id);
CREATE INDEX IF NOT EXISTS idx_wifi_networks_status ON wifi_networks(status);
CREATE INDEX IF NOT EXISTS idx_wifi_categories_network ON wifi_voucher_categories(network_id);
CREATE INDEX IF NOT EXISTS idx_wifi_vouchers_available ON wifi_vouchers(category_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wifi_purchases_buyer_created ON wifi_voucher_purchases(buyer_id, created_at DESC);

-- Force the legacy platform commission setting to zero where the legacy table exists.
DO $$ BEGIN
  IF to_regclass('public.platform_settings') IS NOT NULL THEN
    INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, is_public)
    VALUES ('default_commission_rate', '0', 'number', 'Platform commission is permanently fixed at 0%', false)
    ON CONFLICT (setting_key) DO UPDATE SET setting_value='0', setting_type='number',
      description='Platform commission is permanently fixed at 0%', updated_at=NOW();
  END IF;
END $$;
