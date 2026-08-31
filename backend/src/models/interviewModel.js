const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT i.*, u.first_name AS interviewer_first_name, u.last_name AS interviewer_last_name
  FROM interviews i
  LEFT JOIN users u ON u.id = i.interviewer_id
`;

async function create(companyId, jobApplicationId, { scheduledAt, method, interviewerId, notes = null }) {
  const [result] = await pool.query(
    `INSERT INTO interviews (company_id, job_application_id, scheduled_at, method, interviewer_id, notes)
     VALUES (:companyId, :jobApplicationId, :scheduledAt, :method, :interviewerId, :notes)`,
    { companyId, jobApplicationId, scheduledAt, method, interviewerId, notes }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE i.id = :id AND i.company_id = :companyId LIMIT 1`, { id, companyId });
  return rows[0] || null;
}

async function listForApplication(companyId, jobApplicationId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE i.company_id = :companyId AND i.job_application_id = :jobApplicationId ORDER BY i.scheduled_at`,
    { companyId, jobApplicationId }
  );
  return rows;
}

async function update(id, companyId, fields) {
  const allowed = ['scheduled_at', 'method', 'interviewer_id', 'notes', 'status'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE interviews SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

module.exports = { create, findByIdAndCompany, listForApplication, update };
