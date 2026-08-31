const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT pi.*, e.first_name, e.last_name, e.employee_code, e.department_id, d.name AS department_name
  FROM payroll_items pi
  JOIN employees e ON e.id = pi.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
`;

async function bulkCreate(companyId, payrollId, items) {
  for (const item of items) {
    await pool.query(
      `INSERT INTO payroll_items
        (company_id, payroll_id, employee_id, basic_salary, allowances, bonuses, deductions, tax, net_salary)
       VALUES (:companyId, :payrollId, :employeeId, :basicSalary, :allowances, :bonuses, :deductions, :tax, :netSalary)
       ON DUPLICATE KEY UPDATE
         basic_salary = VALUES(basic_salary), allowances = VALUES(allowances), bonuses = VALUES(bonuses),
         deductions = VALUES(deductions), tax = VALUES(tax), net_salary = VALUES(net_salary)`,
      {
        companyId,
        payrollId,
        employeeId: item.employeeId,
        basicSalary: item.basicSalary,
        allowances: item.allowances,
        bonuses: item.bonuses,
        deductions: item.deductions,
        tax: item.tax,
        netSalary: item.netSalary,
      }
    );
  }
}

async function listByPayroll(companyId, payrollId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE pi.company_id = :companyId AND pi.payroll_id = :payrollId ORDER BY e.first_name`,
    { companyId, payrollId }
  );
  return rows;
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE pi.id = :id AND pi.company_id = :companyId LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function update(id, companyId, fields) {
  const allowed = ['allowances', 'bonuses', 'deductions', 'tax', 'net_salary', 'notes'];
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
    `UPDATE payroll_items SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    params
  );
  return findByIdAndCompany(id, companyId);
}

async function markAllPaid(companyId, payrollId) {
  await pool.query(
    `UPDATE payroll_items SET payment_status = 'paid' WHERE company_id = :companyId AND payroll_id = :payrollId`,
    { companyId, payrollId }
  );
}

/** An employee's payroll line items across every processed run — "View salary history". */
async function listForEmployee(companyId, employeeId, { page = 1, pageSize = 20 } = {}) {
  const params = { companyId, employeeId };
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM payroll_items WHERE company_id = :companyId AND employee_id = :employeeId`,
    params
  );
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `SELECT pi.*, p.period_start, p.period_end, p.pay_date, p.status AS payroll_status
     FROM payroll_items pi
     JOIN payroll p ON p.id = pi.payroll_id
     WHERE pi.company_id = :companyId AND pi.employee_id = :employeeId
     ORDER BY p.period_start DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

module.exports = { bulkCreate, listByPayroll, findByIdAndCompany, update, markAllPaid, listForEmployee };
