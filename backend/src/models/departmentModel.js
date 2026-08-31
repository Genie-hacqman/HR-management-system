const { pool } = require('../config/db');

async function create(companyId, { name, description = null, managerId = null }) {
  const [result] = await pool.query(
    `INSERT INTO departments (company_id, name, description, manager_id)
     VALUES (:companyId, :name, :description, :managerId)`,
    { companyId, name, description, managerId }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function listByCompany(companyId, { search = null } = {}) {
  const params = { companyId };
  let sql = `
    SELECT d.*, m.first_name AS manager_first_name, m.last_name AS manager_last_name,
           (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.deleted_at IS NULL) AS employee_count
    FROM departments d
    LEFT JOIN employees m ON m.id = d.manager_id
    WHERE d.company_id = :companyId AND d.deleted_at IS NULL
  `;
  if (search) {
    sql += ` AND d.name LIKE :search`;
    params.search = `%${search}%`;
  }
  sql += ` ORDER BY d.name ASC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM departments WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findByNameAndCompany(name, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM departments WHERE name = :name AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { name, companyId }
  );
  return rows[0] || null;
}

async function update(id, companyId, fields) {
  const allowed = ['name', 'description', 'manager_id'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(
    `UPDATE departments SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    params
  );
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(
    `UPDATE departments SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`,
    { id, companyId }
  );
}

module.exports = {
  create,
  listByCompany,
  findByIdAndCompany,
  findByNameAndCompany,
  update,
  softDelete,
};
