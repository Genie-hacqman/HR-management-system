const payrollModel = require('../models/payrollModel');
const payrollItemModel = require('../models/payrollItemModel');
const payslipModel = require('../models/payslipModel');
const employeeModel = require('../models/employeeModel');
const companyModel = require('../models/companyModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

/**
 * Pluggable tax calculator. Spec Section 9: "Design the payroll
 * architecture so country-specific tax and statutory rules can be
 * added later." This is intentionally the ONLY place tax logic lives —
 * swapping in a real bracket table per country means editing this
 * function (or routing to a per-country module keyed on
 * company.country), not touching models, controllers, or the DB
 * schema. The default here is a simple flat placeholder rate.
 */
function calculateTax(grossPay, _company) {
  const FLAT_RATE = 0.1; // 10% placeholder — replace per-country as needed.
  return Math.round(grossPay * FLAT_RATE * 100) / 100;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function requireEmployeeForUser(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account');
  }
  return employee;
}

// --- Payroll period lifecycle ------------------------------------------------

async function createPeriod(companyId, userId, { periodStart, periodEnd, payDate, notes }) {
  if (new Date(periodEnd) < new Date(periodStart)) {
    throw new ApiError(422, 'periodEnd must be on or after periodStart');
  }
  const overlapping = await payrollModel.findOverlapping(companyId, periodStart, periodEnd);
  if (overlapping.length > 0) {
    throw new ApiError(409, 'A payroll period already exists that overlaps these dates');
  }
  return payrollModel.create(companyId, { periodStart, periodEnd, payDate, createdBy: userId, notes });
}

async function listPeriods(companyId, filters) {
  return payrollModel.listByCompany(companyId, filters);
}

async function getPeriod(companyId, id) {
  const payroll = await payrollModel.findByIdAndCompany(id, companyId);
  if (!payroll) throw new ApiError(404, 'Payroll period not found');
  return payroll;
}

async function getPeriodWithItems(companyId, id) {
  const payroll = await getPeriod(companyId, id);
  const items = await payrollItemModel.listByPayroll(companyId, id);
  return { payroll, items };
}

/** "Calculate payroll" — builds one line item per active employee from their current salary. */
async function calculatePeriod(companyId, id) {
  const payroll = await getPeriod(companyId, id);
  if (payroll.status !== 'draft') {
    throw new ApiError(422, 'Only a draft payroll period can be calculated');
  }
  const company = await companyModel.findById(companyId);
  const { data: employees } = await employeeModel.listByCompany(companyId, {
    status: 'active', pageSize: 100000,
  });

  const items = employees
    .filter((e) => e.salary !== null && e.salary !== undefined)
    .map((e) => {
      const basicSalary = Number(e.salary);
      const allowances = 0;
      const bonuses = 0;
      const deductions = 0;
      const grossPay = basicSalary + allowances + bonuses;
      const tax = calculateTax(grossPay, company);
      const netSalary = round2(grossPay - deductions - tax);
      return { employeeId: e.id, basicSalary, allowances, bonuses, deductions, tax, netSalary };
    });

  if (items.length === 0) {
    throw new ApiError(422, 'No active employees with a salary on file to calculate payroll for');
  }

  await payrollItemModel.bulkCreate(companyId, id, items);
  return payrollModel.setStatus(id, companyId, 'calculated');
}

/** "Review payroll" — HR can adjust individual line items while status is calculated/reviewed. */
async function updateItem(companyId, payrollId, itemId, fields) {
  const payroll = await getPeriod(companyId, payrollId);
  if (!['calculated', 'reviewed'].includes(payroll.status)) {
    throw new ApiError(422, 'Payroll items can only be edited while the period is calculated or under review');
  }
  const item = await payrollItemModel.findByIdAndCompany(itemId, companyId);
  if (!item || item.payroll_id !== Number(payrollId)) {
    throw new ApiError(404, 'Payroll item not found');
  }

  const basicSalary = Number(item.basic_salary);
  const allowances = fields.allowances !== undefined ? Number(fields.allowances) : Number(item.allowances);
  const bonuses = fields.bonuses !== undefined ? Number(fields.bonuses) : Number(item.bonuses);
  const deductions = fields.deductions !== undefined ? Number(fields.deductions) : Number(item.deductions);
  const tax = fields.tax !== undefined ? Number(fields.tax) : Number(item.tax);
  const netSalary = round2(basicSalary + allowances + bonuses - deductions - tax);

  return payrollItemModel.update(itemId, companyId, {
    allowances, bonuses, deductions, tax, net_salary: netSalary, notes: fields.notes,
  });
}

async function markReviewed(companyId, id) {
  const payroll = await getPeriod(companyId, id);
  if (payroll.status !== 'calculated') {
    throw new ApiError(422, 'Only a calculated payroll period can be marked as reviewed');
  }
  return payrollModel.setStatus(id, companyId, 'reviewed');
}

/** "Approve payroll" — locks the period; only approved periods can be processed. */
async function approvePeriod(companyId, userId, id) {
  const payroll = await getPeriod(companyId, id);
  if (payroll.status !== 'reviewed') {
    throw new ApiError(422, 'Only a reviewed payroll period can be approved');
  }
  return payrollModel.setStatus(id, companyId, 'approved', { approved_by: userId, approved_at: new Date() });
}

/** "Process payroll" — marks items paid and generates payslips employees can view. */
async function processPeriod(companyId, id) {
  const payroll = await getPeriod(companyId, id);
  if (payroll.status !== 'approved') {
    throw new ApiError(422, 'Only an approved payroll period can be processed');
  }
  await payrollItemModel.markAllPaid(companyId, id);
  await payslipModel.generateForPayroll(companyId, id);
  const processed = await payrollModel.setStatus(id, companyId, 'processed', { processed_at: new Date() });

  const items = await payrollItemModel.listByPayroll(companyId, id);
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const employee = await employeeModel.findByIdAndCompany(item.employee_id, companyId);
    // eslint-disable-next-line no-await-in-loop
    await notificationService.notifyEmployee(companyId, employee, {
      type: 'payroll_available',
      title: 'Your payslip is available',
      message: `Pay period ${payroll.period_start} to ${payroll.period_end}`,
      link: '/dashboard/my-payslips',
    });
  }

  return processed;
}

// --- Employee self-service --------------------------------------------------

async function getMyPayslips(companyId, userId, filters) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return payslipModel.listForEmployee(companyId, employee.id, filters);
}

async function getMyPayslip(companyId, userId, payslipId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  const payslip = await payslipModel.findByIdForEmployee(payslipId, companyId, employee.id);
  if (!payslip) throw new ApiError(404, 'Payslip not found');
  return payslip;
}

async function getMySalaryHistory(companyId, userId, filters) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return payrollItemModel.listForEmployee(companyId, employee.id, filters);
}

module.exports = {
  createPeriod,
  listPeriods,
  getPeriod,
  getPeriodWithItems,
  calculatePeriod,
  updateItem,
  markReviewed,
  approvePeriod,
  processPeriod,
  getMyPayslips,
  getMyPayslip,
  getMySalaryHistory,
  calculateTax,
};
