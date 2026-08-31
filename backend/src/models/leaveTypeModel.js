const { pool } = require('../config/db');

async function listByCompany(companyId, { includeArchived = false } = {}) {
  const params = { companyId };
  let sql = `SELECT * FROM leave_types WHERE company_id = :companyId`;
  if (!includeArchived) sql += ` AND deleted_at IS NULL`;
  sql += ` ORDER BY name`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM leave_types WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findByNameAndCompany(name, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM leave_types WHERE name = :name AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { name, companyId }
  );
  return rows[0] || null;
}

async function create(companyId, { name, description = null, defaultDaysPerYear = 0, isPaid = true, requiresDocument = false }) {
  const [result] = await pool.query(
    `INSERT INTO leave_types (company_id, name, description, default_days_per_year, is_paid, requires_document)
     VALUES (:companyId, :name, :description, :defaultDaysPerYear, :isPaid, :requiresDocument)`,
    { companyId, name, description, defaultDaysPerYear, isPaid, requiresDocument }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function update(id, companyId, fields) {
  const allowed = ['name', 'description', 'default_days_per_year', 'is_paid', 'requires_document'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE leave_types SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(`UPDATE leave_types SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`, { id, companyId });
}

module.exports = { listByCompany, findByIdAndCompany, findByNameAndCompany, create, update, softDelete };
