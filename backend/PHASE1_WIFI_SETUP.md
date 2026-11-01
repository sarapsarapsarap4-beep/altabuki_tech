# Phase 1 — Wi-Fi voucher platform setup

## Required private environment values

Set these in the deployment secret store (or a local `backend/.env` that is never committed):

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: at least 32 characters of random secret material.
- `ADMIN_EMAIL`: defaults to `admin@mymart.com`.
- `ADMIN_PASSWORD`: a unique password of at least 12 characters. Do not send it in chat or commit it.
- `VOUCHER_ENCRYPTION_KEY`: 64 hex characters (32 random bytes). Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and keep the key stable.

## Apply database migrations

Back up the database first, then from `backend/` run:

```sh
node run-migrations.js
```

Verify that `phase22_zero_platform_commission.sql` and `phase23_wifi_voucher_platform.sql` complete successfully in the logs. The existing migration runner may continue after an individual migration error, so inspect the full output and verify the tables before deployment. Do not run against production until the backup and schema compatibility have been checked.

## Create or reset the administrator

From `backend/` run:

```sh
node setup-admin.js
```

This creates or updates the configured administrator, but it can only be verified against the database that the environment points to. The password is never printed. The default email is `admin@mymart.com`; the password is only the private value set as `ADMIN_PASSWORD`.

## Phase 1 behavior

- The mobile `معرض شبكاتي` screen only calls the authenticated owner's own-network endpoint.
- New network registrations wait for admin approval. Category management is only available for approved networks.
- Approved public networks and their categories are visible to customers.
- Voucher codes/secrets are stored encrypted with AES-256-GCM; voucher inventory insertion fails closed when the encryption key is missing.
- Voucher purchase debits the buyer and credits the network owner in one database transaction, records both ledger entries, returns the voucher only after commit, and records platform commission as exactly 0%.
- A test wallet-credit endpoint is disabled when `NODE_ENV=production`.

## Important release checks still required

The source-level tests do not substitute for staging integration tests. Configure private document storage and review access controls before collecting real identity documents. Test migrations against a database clone, exercise login/approval/purchase/rollback with multiple accounts, build the Flutter APK and React dashboard, and test on a physical Android device before production rollout. Payment-provider integration and live wallet top-up/withdrawal remain outside Phase 1.
