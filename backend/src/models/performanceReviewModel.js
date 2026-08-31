const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT r.*, e.first_name, e.last_name, e.employee_code,
         u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name
  FROM performance_reviews r
  JOIN employees e ON e.id = r.employee_id
  LEFT JOIN users u ON u.id = r.reviewer_id
`;

async function create(companyId, { employeeId, reviewerId, reviewPeriodStart, reviewPeriodEnd }) {
  const [result] = await pool.query(
    `INSERT INTO performance_reviews (company_id, employee_id, reviewer_id, review_period_start, review_period_end)
     VALUES (:companyId, :employeeId, :reviewerId, :reviewPeriodStart, :reviewPeriodEnd)`,
    { companyId, employeeId, reviewerId, reviewPeriodStart, reviewPeriodEnd }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE r.id = :id AND r.company_id = :companyId LIMIT 1`, { id, companyId });
  return rows[0] || null;
}

async function listByCompany(companyId, { employeeId = null, status = null } = {}) {
  const params = { companyId };
  let where = `WHERE r.company_id = :companyId`;
  if (employeeId) {
    where += ` AND r.employee_id = :employeeId`;
    params.employeeId = employeeId;
  }
  if (status) {
    where += ` AND r.status = :status`;
    params.status = status;
  }
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY r.review_period_start DESC`, params);
  return rows;
}

async function listVisibleForEmployee(companyId, employeeId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE r.company_id = :companyId AND r.employee_id = :employeeId
       AND r.status IN ('submitted', 'reviewed', 'completed')
     ORDER BY r.review_period_start DESC`,
    { companyId, employeeId }
  );
  return rows;
}

async function update(id, companyId, fields) {
  const allowed = ['strengths', 'areas_for_improvement', 'manager_feedback', 'overall_rating', 'employee_comments'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE performance_reviews SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

async function setStatus(id, companyId, status, extra = {}) {
  const fields = { status, ...extra };
  const setClauses = Object.keys(fields).map((k) => `${k} = :${k}`);
  await pool.query(
    `UPDATE performance_reviews SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    { ...fields, id, companyId }
  );
  return findByIdAndCompany(id, companyId);
}

module.exports = { create, findByIdAndCompany, listByCompany, listVisibleForEmployee, update, setStatus };
