const { pool } = require('../config/db');

async function create(companyId, { title, description = null, departmentId = null }) {
  const [result] = await pool.query(
    `INSERT INTO positions (company_id, department_id, title, description)
     VALUES (:companyId, :departmentId, :title, :description)`,
    { companyId, departmentId, title, description }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function listByCompany(companyId, { search = null, departmentId = null } = {}) {
  const params = { companyId };
  let sql = `
    SELECT p.*, d.name AS department_name,
           (SELECT COUNT(*) FROM employees e WHERE e.position_id = p.id AND e.deleted_at IS NULL) AS employee_count
    FROM positions p
    LEFT JOIN departments d ON d.id = p.department_id
    WHERE p.company_id = :companyId AND p.deleted_at IS NULL
  `;
  if (search) {
    sql += ` AND p.title LIKE :search`;
    params.search = `%${search}%`;
  }
  if (departmentId) {
    sql += ` AND p.department_id = :departmentId`;
    params.departmentId = departmentId;
  }
  sql += ` ORDER BY p.title ASC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM positions WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findByTitleAndCompany(title, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM positions WHERE title = :title AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { title, companyId }
  );
  return rows[0] || null;
}

async function update(id, companyId, fields) {
  const allowed = ['title', 'description', 'department_id'];
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
    `UPDATE positions SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    params
  );
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(
    `UPDATE positions SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`,
    { id, companyId }
  );
}

module.exports = {
  create,
  listByCompany,
  findByIdAndCompany,
  findByTitleAndCompany,
  update,
  softDelete,
};
