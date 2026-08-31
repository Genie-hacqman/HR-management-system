const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT
    lr.*,
    e.first_name, e.last_name, e.employee_code, e.department_id, e.manager_id,
    d.name AS department_name,
    lt.name AS leave_type_name,
    r.first_name AS reviewer_first_name, r.last_name AS reviewer_last_name
  FROM leave_requests lr
  JOIN employees e ON e.id = lr.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
  JOIN leave_types lt ON lt.id = lr.leave_type_id
  LEFT JOIN users r ON r.id = lr.reviewed_by
`;

async function create(companyId, {
  employeeId, leaveTypeId, startDate, endDate, totalDays, reason = null, supportingDocumentUrl = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO leave_requests
      (company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, supporting_document_url, status)
     VALUES (:companyId, :employeeId, :leaveTypeId, :startDate, :endDate, :totalDays, :reason, :supportingDocumentUrl, 'pending')`,
    { companyId, employeeId, leaveTypeId, startDate, endDate, totalDays, reason, supportingDocumentUrl }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE lr.id = :id AND lr.company_id = :companyId LIMIT 1`, { id, companyId });
  return rows[0] || null;
}

/** Overlapping pending/approved requests for the same employee — used to block double-booking. */
async function findOverlapping(employeeId, startDate, endDate, excludeId = null) {
  const params = { employeeId, startDate, endDate };
  let sql = `
    SELECT * FROM leave_requests
    WHERE employee_id = :employeeId
      AND status IN ('pending', 'approved')
      AND start_date <= :endDate AND end_date >= :startDate
  `;
  if (excludeId) {
    sql += ` AND id != :excludeId`;
    params.excludeId = excludeId;
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function listForEmployee(employeeId, { status = null, page = 1, pageSize = 20 } = {}) {
  const params = { employeeId };
  let where = `WHERE lr.employee_id = :employeeId`;
  if (status) {
    where += ` AND lr.status = :status`;
    params.status = status;
  }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM leave_requests lr ${where}`, params);
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY lr.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function listByCompany(companyId, {
  status = null, employeeId = null, departmentId = null, dateFrom = null, dateTo = null, page = 1, pageSize = 20,
} = {}) {
  const params = { companyId };
  let where = `WHERE lr.company_id = :companyId`;
  if (status) {
    where += ` AND lr.status = :status`;
    params.status = status;
  }
  if (employeeId) {
    where += ` AND lr.employee_id = :employeeId`;
    params.employeeId = employeeId;
  }
  if (departmentId) {
    where += ` AND e.department_id = :departmentId`;
    params.departmentId = departmentId;
  }
  if (dateFrom) {
    where += ` AND lr.end_date >= :dateFrom`;
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    where += ` AND lr.start_date <= :dateTo`;
    params.dateTo = dateTo;
  }
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id ${where}`,
    params
  );
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 200);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY lr.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

/** Approved leave within a date range, company-wide — "View company leave calendar". */
async function listCalendar(companyId, { dateFrom, dateTo }) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE lr.company_id = :companyId AND lr.status = 'approved'
       AND lr.start_date <= :dateTo AND lr.end_date >= :dateFrom
     ORDER BY lr.start_date`,
    { companyId, dateFrom, dateTo }
  );
  return rows;
}

/** A manager's direct reports' leave requests. */
async function listForManagerTeam(companyId, managerId, { status = null } = {}) {
  const params = { companyId, managerId };
  let where = `WHERE lr.company_id = :companyId AND e.manager_id = :managerId`;
  if (status) {
    where += ` AND lr.status = :status`;
    params.status = status;
  }
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY lr.created_at DESC`, params);
  return rows;
}

async function setStatus(id, companyId, { status, reviewedBy = null, reviewerNotes = null }) {
  await pool.query(
    `UPDATE leave_requests
     SET status = :status, reviewed_by = :reviewedBy, reviewed_at = NOW(), reviewer_notes = :reviewerNotes
     WHERE id = :id AND company_id = :companyId`,
    { id, companyId, status, reviewedBy, reviewerNotes }
  );
  return findByIdAndCompany(id, companyId);
}

async function cancel(id, companyId) {
  await pool.query(
    `UPDATE leave_requests SET status = 'cancelled' WHERE id = :id AND company_id = :companyId`,
    { id, companyId }
  );
  return findByIdAndCompany(id, companyId);
}

module.exports = {
  create,
  findByIdAndCompany,
  findOverlapping,
  listForEmployee,
  listByCompany,
  listCalendar,
  listForManagerTeam,
  setStatus,
  cancel,
};
