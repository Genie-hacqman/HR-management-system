const { pool } = require('../config/db');

async function generateForPayroll(companyId, payrollId) {
  await pool.query(
    `INSERT INTO payslips
      (company_id, payroll_item_id, employee_id, payroll_id, period_start, period_end, pay_date,
       basic_salary, allowances, bonuses, deductions, tax, net_salary)
     SELECT
       pi.company_id, pi.id, pi.employee_id, pi.payroll_id, p.period_start, p.period_end, p.pay_date,
       pi.basic_salary, pi.allowances, pi.bonuses, pi.deductions, pi.tax, pi.net_salary
     FROM payroll_items pi
     JOIN payroll p ON p.id = pi.payroll_id
     WHERE pi.company_id = :companyId AND pi.payroll_id = :payrollId
     ON DUPLICATE KEY UPDATE payroll_item_id = payroll_item_id`,
    { companyId, payrollId }
  );
}

async function listForEmployee(companyId, employeeId, { page = 1, pageSize = 20 } = {}) {
  const params = { companyId, employeeId };
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM payslips WHERE company_id = :companyId AND employee_id = :employeeId`,
    params
  );
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM payslips WHERE company_id = :companyId AND employee_id = :employeeId
     ORDER BY period_start DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function findByIdForEmployee(id, companyId, employeeId) {
  const [rows] = await pool.query(
    `SELECT * FROM payslips WHERE id = :id AND company_id = :companyId AND employee_id = :employeeId LIMIT 1`,
    { id, companyId, employeeId }
  );
  return rows[0] || null;
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT ps.*, e.first_name, e.last_name, e.employee_code
     FROM payslips ps JOIN employees e ON e.id = ps.employee_id
     WHERE ps.id = :id AND ps.company_id = :companyId LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

module.exports = { generateForPayroll, listForEmployee, findByIdForEmployee, findByIdAndCompany };
