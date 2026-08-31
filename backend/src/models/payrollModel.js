const { pool } = require('../config/db');

async function create(companyId, { periodStart, periodEnd, payDate, createdBy, notes = null }) {
  const [result] = await pool.query(
    `INSERT INTO payroll (company_id, period_start, period_end, pay_date, created_by, notes)
     VALUES (:companyId, :periodStart, :periodEnd, :payDate, :createdBy, :notes)`,
    { companyId, periodStart, periodEnd, payDate, createdBy, notes }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM payroll WHERE id = :id AND company_id = :companyId LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findOverlapping(companyId, periodStart, periodEnd) {
  const [rows] = await pool.query(
    `SELECT * FROM payroll
     WHERE company_id = :companyId AND period_start <= :periodEnd AND period_end >= :periodStart`,
    { companyId, periodStart, periodEnd }
  );
  return rows;
}

async function listByCompany(companyId, { status = null, page = 1, pageSize = 20 } = {}) {
  const params = { companyId };
  let where = `WHERE company_id = :companyId`;
  if (status) {
    where += ` AND status = :status`;
    params.status = status;
  }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM payroll ${where}`, params);
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM payroll ${where} ORDER BY period_start DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function setStatus(id, companyId, status, extra = {}) {
  const fields = { status, ...extra };
  const setClauses = Object.keys(fields).map((k) => `${k} = :${k}`);
  await pool.query(
    `UPDATE payroll SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    { ...fields, id, companyId }
  );
  return findByIdAndCompany(id, companyId);
}

module.exports = { create, findByIdAndCompany, findOverlapping, listByCompany, setStatus };
