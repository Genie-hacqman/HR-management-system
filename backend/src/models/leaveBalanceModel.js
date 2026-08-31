const { pool } = require('../config/db');

/**
 * Returns the balance row for (employee, leaveType, year), creating it
 * with the leave type's default allocation if it doesn't exist yet.
 * This means adding a new leave type never requires a backfill: the
 * row simply appears the first time it's needed.
 */
async function getOrCreate(companyId, employeeId, leaveType, year) {
  const [rows] = await pool.query(
    `SELECT * FROM leave_balances WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId AND year = :year LIMIT 1`,
    { employeeId, leaveTypeId: leaveType.id, year }
  );
  if (rows[0]) return rows[0];

  await pool.query(
    `INSERT INTO leave_balances (company_id, employee_id, leave_type_id, year, allocated_days, used_days)
     VALUES (:companyId, :employeeId, :leaveTypeId, :year, :allocatedDays, 0)
     ON DUPLICATE KEY UPDATE employee_id = employee_id`,
    { companyId, employeeId, leaveTypeId: leaveType.id, year, allocatedDays: leaveType.default_days_per_year }
  );
  const [created] = await pool.query(
    `SELECT * FROM leave_balances WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId AND year = :year LIMIT 1`,
    { employeeId, leaveTypeId: leaveType.id, year }
  );
  return created[0];
}

async function listForEmployee(companyId, employeeId, year) {
  const [rows] = await pool.query(
    `SELECT lb.*, lt.name AS leave_type_name, lt.is_paid, lt.requires_document
     FROM leave_types lt
     LEFT JOIN leave_balances lb
       ON lb.leave_type_id = lt.id AND lb.employee_id = :employeeId AND lb.year = :year
     WHERE lt.company_id = :companyId AND lt.deleted_at IS NULL
     ORDER BY lt.name`,
    { companyId, employeeId, year }
  );
  // Rows without a balance yet show the type's default allocation, unused.
  return rows.map((r) => ({
    leave_type_id: r.leave_type_id ?? null,
    leave_type_name: r.leave_type_name,
    is_paid: r.is_paid,
    requires_document: r.requires_document,
    year,
    allocated_days: r.allocated_days ?? null,
    used_days: r.used_days ?? 0,
  }));
}

/** Adds (positive) or removes (negative) days from an employee's used balance for a given type/year. */
async function adjustUsedDays(employeeId, leaveTypeId, year, deltaDays) {
  await pool.query(
    `UPDATE leave_balances SET used_days = used_days + :deltaDays
     WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId AND year = :year`,
    { employeeId, leaveTypeId, year, deltaDays }
  );
}

module.exports = { getOrCreate, listForEmployee, adjustUsedDays };
