const { pool } = require('../config/db');

async function create({
  name, slug, email, phone, address, country, currency, timezone, registrationNumber, industry,
}) {
  const [result] = await pool.query(
    `INSERT INTO companies
      (name, slug, email, phone, address, country, currency, timezone, registration_number, industry, status)
     VALUES (:name, :slug, :email, :phone, :address, :country, :currency, :timezone, :registrationNumber, :industry, 'trial')`,
    { name, slug, email, phone, address, country, currency, timezone, registrationNumber, industry }
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM companies WHERE id = :id AND deleted_at IS NULL LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function listAll({ search = null, status = null } = {}) {
  const params = {};
  let sql = `SELECT * FROM companies WHERE deleted_at IS NULL`;
  if (search) {
    sql += ` AND (name LIKE :search OR email LIKE :search)`;
    params.search = `%${search}%`;
  }
  if (status) {
    sql += ` AND status = :status`;
    params.status = status;
  }
  sql += ` ORDER BY created_at DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT * FROM companies WHERE slug = :slug AND deleted_at IS NULL LIMIT 1`,
    { slug }
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM companies WHERE email = :email AND deleted_at IS NULL LIMIT 1`,
    { email }
  );
  return rows[0] || null;
}

async function updateSettings(id, fields) {
  const allowed = [
    'name', 'logo_url', 'registration_number', 'industry', 'email', 'phone',
    'address', 'country', 'currency', 'timezone', 'working_hours_start', 'working_hours_end',
  ];
  const setClauses = [];
  const params = { id };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findById(id);

  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = :id`,
    params
  );
  return findById(id);
}

async function setStatus(id, status) {
  await pool.query(`UPDATE companies SET status = :status WHERE id = :id`, { id, status });
  return findById(id);
}

module.exports = { create, findById, findBySlug, findByEmail, listAll, updateSettings, setStatus };
