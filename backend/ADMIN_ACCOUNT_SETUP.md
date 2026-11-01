# Administrator account setup and password reset

The repository previously contained multiple conflicting default administrator passwords (`admin123` and `Admin@123`). Those defaults are unsafe and have been removed from the setup/seed flows in this working copy. Do not rely on either old password.

## Account identifier

Default administrator email: `admin@mymart.com` (override with `ADMIN_EMAIL`).

## Set or reset the administrator password

1. Create/update `backend/.env` from `.env.example` if needed.
2. Set `DATABASE_URL` to the intended PostgreSQL database.
3. Set `JWT_SECRET` to a private random value of at least 32 characters.
4. Set `ADMIN_EMAIL=admin@mymart.com` (or the intended admin email).
5. Set `ADMIN_PASSWORD` to a unique password of at least 12 characters. Do not put real secrets in Git, screenshots, or chat.
6. From the `backend` directory, run:

   ```sh
   node setup-admin.js
   ```

The script creates or resets that account as an active `admin`, stores a bcrypt hash, and never prints the password. It refuses to run if the password or JWT secret is missing/too weak.

## Admin dashboard access

Use the configured email and the password you supplied privately to `ADMIN_PASSWORD`. The dashboard now refuses to save a session or accept an existing session if the authenticated role is not `admin`.

## Important

- Do not run `node src/setup.js` or seed scripts against production until `DATABASE_URL` has been checked carefully.
- `seed.js` and `seed-only.js` still seed demo commerce data for development; they are not production data migrations.
- This setup does not verify the dashboard against a live database because no production database credentials were supplied in this workspace.
