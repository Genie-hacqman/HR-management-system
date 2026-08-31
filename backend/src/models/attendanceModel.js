const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT
    a.*,
    e.first_name, e.last_name, e.employee_code, e.department_id, e.manager_id,
    d.name AS department_name
  FROM attendance_records a
  JOIN employees e ON e.id = a.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
`;

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function findByEmployeeAndDate(employeeId, date) {
  const [rows] = await pool.query(
    `SELECT * FROM attendance_records WHERE employee_id = :employeeId AND work_date = :date LIMIT 1`,
    { employeeId, date }
  );
  return rows[0] || null;
}

async function clockIn(companyId, employeeId, { date = todayDateString(), status = 'present', lat = null, lng = null } = {}) {
  const existing = await findByEmployeeAndDate(employeeId, date);
  if (existing && existing.clock_in_at) {
    const err = new Error('You have already clocked in today');
    err.statusCode = 409;
    throw err;
  }

  if (existing) {
    await pool.query(
      `UPDATE attendance_records
       SET clock_in_at = NOW(), clock_in_lat = :lat, clock_in_lng = :lng, status = :status
       WHERE id = :id`,
      { id: existing.id, lat, lng, status }
    );
    return findByEmployeeAndDate(employeeId, date);
  }

  await pool.query(
    `INSERT INTO attendance_records (company_id, employee_id, work_date, clock_in_at, clock_in_lat, clock_in_lng, status)
     VALUES (:companyId, :employeeId, :date, NOW(), :lat, :lng, :status)`,
    { companyId, employeeId, date, lat, lng, status }
  );
  return findByEmployeeAndDate(employeeId, date);
}

async function clockOut(employeeId, { date = todayDateString(), lat = null, lng = null } = {}) {
  const existing = await findByEmployeeAndDate(employeeId, date);
  if (!existing || !existing.clock_in_at) {
    const err = new Error('You have not clocked in today');
    err.statusCode = 409;
    throw err;
  }
  if (existing.clock_out_at) {
    const err = new Error('You have already clocked out today');
    err.statusCode = 409;
    throw err;
  }

  await pool.query(
    `UPDATE attendance_records
     SET clock_out_at = NOW(),
         clock_out_lat = :lat,
         clock_out_lng = :lng,
         total_minutes = TIMESTAMPDIFF(MINUTE, clock_in_at, NOW())
     WHERE id = :id`,
    { id: existing.id, lat, lng }
  );
  return findByEmployeeAndDate(employeeId, date);
}

async function listForEmployee(employeeId, { dateFrom = null, dateTo = null, page = 1, pageSize = 30 } = {}) {
  const params = { employeeId };
  let where = `WHERE employee_id = :employeeId`;
  if (dateFrom) {
    where += ` AND work_date >= :dateFrom`;
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    where += ` AND work_date <= :dateTo`;
    params.dateTo = dateTo;
  }

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM attendance_records ${where}`, params);

  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 30, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM attendance_records ${where} ORDER BY work_date DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function sumHoursForEmployee(employeeId, { dateFrom, dateTo }) {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(total_minutes), 0) AS total_minutes, COUNT(*) AS days_recorded
     FROM attendance_records
     WHERE employee_id = :employeeId AND work_date BETWEEN :dateFrom AND :dateTo`,
    { employeeId, dateFrom, dateTo }
  );
  return row;
}

/**
 * Company-wide attendance listing with filters, used by Admin/HR.
 * companyId MUST come from req.companyId — never client input.
 */
async function listByCompany(companyId, {
  employeeId = null, departmentId = null, dateFrom = null, dateTo = null,
  status = null, page = 1, pageSize = 20,
} = {}) {
  const params = { companyId };
  let where = `WHERE a.company_id = :companyId`;

  if (employeeId) {
    where += ` AND a.employee_id = :employeeId`;
    params.employeeId = employeeId;
  }
  if (departmentId) {
    where += ` AND e.department_id = :departmentId`;
    params.departmentId = departmentId;
  }
  if (dateFrom) {
    where += ` AND a.work_date >= :dateFrom`;
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    where += ` AND a.work_date <= :dateTo`;
    params.dateTo = dateTo;
  }
  if (status) {
    where += ` AND a.status = :status`;
    params.status = status;
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM attendance_records a JOIN employees e ON e.id = a.employee_id ${where}`,
    params
  );

  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 200);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY a.work_date DESC, e.first_name LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function listByStatusForDate(companyId, status, date) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE a.company_id = :companyId AND a.work_date = :date AND a.status = :status
     ORDER BY e.first_name`,
    { companyId, date, status }
  );
  return rows;
}

/** Active employees in the company who have NO attendance record for the given date (absentees). */
async function listAbsentForDate(companyId, date) {
  const [rows] = await pool.query(
    `SELECT e.id, e.first_name, e.last_name, e.employee_code, e.department_id, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN attendance_records a ON a.employee_id = e.id AND a.work_date = :date
     WHERE e.company_id = :companyId
       AND e.deleted_at IS NULL
       AND e.employment_status = 'active'
       AND a.id IS NULL
     ORDER BY e.first_name`,
    { companyId, date }
  );
  return rows;
}

async function getStatsForDate(companyId, date) {
  const [[activeCount]] = await pool.query(
    `SELECT COUNT(*) AS total FROM employees WHERE company_id = :companyId AND deleted_at IS NULL AND employment_status = 'active'`,
    { companyId }
  );
  const [[counts]] = await pool.query(
    `SELECT
       SUM(status = 'present') AS present,
       SUM(status = 'late') AS late,
       SUM(status = 'on_leave') AS on_leave,
       SUM(status = 'half_day') AS half_day,
       AVG(total_minutes) AS avg_minutes
     FROM attendance_records
     WHERE company_id = :companyId AND work_date = :date`,
    { companyId, date }
  );
  const present = Number(counts.present || 0);
  const late = Number(counts.late || 0);
  const onLeave = Number(counts.on_leave || 0);
  const halfDay = Number(counts.half_day || 0);
  const totalActive = Number(activeCount.total || 0);
  const clockedIn = present + late + halfDay;
  const absent = Math.max(totalActive - clockedIn - onLeave, 0);

  return {
    date,
    totalActiveEmployees: totalActive,
    present,
    late,
    onLeave,
    halfDay,
    absent,
    averageWorkingMinutes: counts.avg_minutes ? Math.round(counts.avg_minutes) : 0,
  };
}

/** Attendance for a manager's direct reports (Manager Dashboard "View team attendance").
 *  Uses a LEFT JOIN from employees so reports who haven't clocked in yet
 *  still appear (with null attendance fields) rather than disappearing. */
async function listForManagerTeam(companyId, managerId, { date = todayDateString() } = {}) {
  const [rows] = await pool.query(
    `SELECT
       e.id AS employee_id, e.first_name, e.last_name, e.employee_code, e.department_id,
       d.name AS department_name,
       a.id AS attendance_id, a.work_date, a.clock_in_at, a.clock_out_at, a.status, a.total_minutes
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN attendance_records a ON a.employee_id = e.id AND a.work_date = :date
     WHERE e.company_id = :companyId AND e.manager_id = :managerId AND e.deleted_at IS NULL
     ORDER BY e.first_name`,
    { companyId, managerId, date }
  );
  return rows;
}

module.exports = {
  todayDateString,
  findByEmployeeAndDate,
  clockIn,
  clockOut,
  listForEmployee,
  sumHoursForEmployee,
  listByCompany,
  listByStatusForDate,
  listAbsentForDate,
  getStatsForDate,
  listForManagerTeam,
};
