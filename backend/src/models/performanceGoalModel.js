const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT g.*, e.first_name, e.last_name, e.employee_code
  FROM performance_goals g
  JOIN employees e ON e.id = g.employee_id
`;

async function create(companyId, {
  employeeId, title, description = null, kpi = null, targetValue = null, startDate = null, dueDate = null, createdBy,
}) {
  const [result] = await pool.query(
    `INSERT INTO performance_goals
      (company_id, employee_id, title, description, kpi, target_value, start_date, due_date, created_by)
     VALUES (:companyId, :employeeId, :title, :description, :kpi, :targetValue, :startDate, :dueDate, :createdBy)`,
    { companyId, employeeId, title, description, kpi, targetValue, startDate, dueDate, createdBy }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE g.id = :id AND g.company_id = :companyId AND g.deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function listByCompany(companyId, { employeeId = null, status = null } = {}) {
  const params = { companyId };
  let where = `WHERE g.company_id = :companyId AND g.deleted_at IS NULL`;
  if (employeeId) {
    where += ` AND g.employee_id = :employeeId`;
    params.employeeId = employeeId;
  }
  if (status) {
    where += ` AND g.status = :status`;
    params.status = status;
  }
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY g.due_date IS NULL, g.due_date ASC`, params);
  return rows;
}

async function listForEmployee(companyId, employeeId) {
  return listByCompany(companyId, { employeeId });
}

async function update(id, companyId, fields) {
  const allowed = ['title', 'description', 'kpi', 'target_value', 'start_date', 'due_date', 'status', 'progress_percent'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE performance_goals SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(`UPDATE performance_goals SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`, { id, companyId });
}

module.exports = { create, findByIdAndCompany, listByCompany, listForEmployee, update, softDelete };
