const attendanceModel = require('../models/attendanceModel');
const employeeModel = require('../models/employeeModel');
const companyModel = require('../models/companyModel');
const { ApiError } = require('../utils/apiResponse');

const LATE_GRACE_MINUTES = 15;

/** Resolves the employee record linked to a logged-in user, or throws. */
async function requireEmployeeForUser(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account, so attendance cannot be recorded');
  }
  return employee;
}

/** Compares now's local time-of-day against the company's configured start time + grace period. */
function isLate(company, now = new Date()) {
  if (!company.working_hours_start) return false;
  const [h, m] = String(company.working_hours_start).split(':').map(Number);
  const scheduledMinutes = h * 60 + m + LATE_GRACE_MINUTES;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes > scheduledMinutes;
}

async function clockIn(companyId, userId, { lat, lng } = {}) {
  const employee = await requireEmployeeForUser(companyId, userId);
  const company = await companyModel.findById(companyId);
  const status = isLate(company) ? 'late' : 'present';
  return attendanceModel.clockIn(companyId, employee.id, { status, lat, lng });
}

async function clockOut(companyId, userId, { lat, lng } = {}) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return attendanceModel.clockOut(employee.id, { lat, lng });
}

async function getMyToday(companyId, userId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  const record = await attendanceModel.findByEmployeeAndDate(employee.id, attendanceModel.todayDateString());
  return record;
}

async function getMyHistory(companyId, userId, filters) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return attendanceModel.listForEmployee(employee.id, filters);
}

async function getMySummary(companyId, userId, { dateFrom, dateTo }) {
  const employee = await requireEmployeeForUser(companyId, userId);
  if (!dateFrom || !dateTo) {
    throw new ApiError(422, 'dateFrom and dateTo are required');
  }
  const row = await attendanceModel.sumHoursForEmployee(employee.id, { dateFrom, dateTo });
  return {
    totalMinutes: Number(row.total_minutes),
    totalHours: Math.round((Number(row.total_minutes) / 60) * 100) / 100,
    daysRecorded: Number(row.days_recorded),
  };
}

async function listCompanyAttendance(companyId, filters) {
  return attendanceModel.listByCompany(companyId, filters);
}

async function listLate(companyId, date = attendanceModel.todayDateString()) {
  return attendanceModel.listByStatusForDate(companyId, 'late', date);
}

async function listAbsent(companyId, date = attendanceModel.todayDateString()) {
  return attendanceModel.listAbsentForDate(companyId, date);
}

async function getDashboardStats(companyId, date = attendanceModel.todayDateString()) {
  return attendanceModel.getStatsForDate(companyId, date);
}

/** Manager's own team attendance — resolves the manager's employee record from their user id. */
async function getTeamAttendance(companyId, userId, { date } = {}) {
  const managerEmployee = await employeeModel.findByUserId(userId);
  if (!managerEmployee || managerEmployee.company_id !== companyId) {
    return [];
  }
  return attendanceModel.listForManagerTeam(companyId, managerEmployee.id, { date });
}

module.exports = {
  clockIn,
  clockOut,
  getMyToday,
  getMyHistory,
  getMySummary,
  listCompanyAttendance,
  listLate,
  listAbsent,
  getDashboardStats,
  getTeamAttendance,
};
