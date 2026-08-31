/**
 * Seeds the platform's bootstrap Super Admin account.
 * Run with: npm run seed:admin
 * Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from .env — never commit
 * real credentials, and change the password immediately after first login.
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

async function run() {
  const email = process.env.SEED_ADMIN_EMAIL || 'superadmin@hrsaas.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const [existing] = await pool.query('SELECT id FROM users WHERE email = :email LIMIT 1', { email });
  if (existing.length > 0) {
    console.log(`[seed] Super admin ${email} already exists — skipping.`);
    process.exit(0);
  }

  const [roleRows] = await pool.query("SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1");
  if (roleRows.length === 0) {
    console.error('[seed] super_admin role not found — run schema.sql and seed.sql first.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.query(
    `INSERT INTO users (company_id, first_name, last_name, email, password_hash, status, email_verified_at)
     VALUES (NULL, 'Super', 'Admin', :email, :passwordHash, 'active', NOW())`,
    { email, passwordHash }
  );

  await pool.query(
    'INSERT INTO user_roles (user_id, role_id, company_id) VALUES (:userId, :roleId, NULL)',
    { userId: result.insertId, roleId: roleRows[0].id }
  );

  console.log(`[seed] Super admin created: ${email}`);
  console.log('[seed] IMPORTANT: log in and change this password immediately.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
