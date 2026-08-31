const attendanceService = require('../services/attendanceService');
const auditLogModel = require('../models/auditLogModel');
const { ok } = require('../utils/apiResponse');

// --- Self-service (Employee) ------------------------------------------------

async function clockIn(req, res, next) {
  try {
    const record = await attendanceService.clockIn(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'attendance.clock_in',
      resource: 'attendance_records',
      resourceId: record.id,
      ipAddress: req.ip,
      newValue: { work_date: record.work_date, status: record.status },
    });
    return ok(res, { record }, 'Clocked in');
  } catch (err) {
    return next(err);
  }
}

async function clockOut(req, res, next) {
  try {
    const record = await attendanceService.clockOut(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'attendance.clock_out',
      resource: 'attendance_records',
      resourceId: record.id,
      ipAddress: req.ip,
      newValue: { total_minutes: record.total_minutes },
    });
    return ok(res, { record }, 'Clocked out');
  } catch (err) {
    return next(err);
  }
}

async function getMyToday(req, res, next) {
  try {
    const record = await attendanceService.getMyToday(req.companyId, req.user.id);
    return ok(res, { record });
  } catch (err) {
    return next(err);
  }
}

async function getMyHistory(req, res, next) {
  try {
    const { dateFrom, dateTo, page, pageSize } = req.query;
    const result = await attendanceService.getMyHistory(req.companyId, req.user.id, { dateFrom, dateTo, page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getMySummary(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const summary = await attendanceService.getMySummary(req.companyId, req.user.id, { dateFrom, dateTo });
    return ok(res, { summary });
  } catch (err) {
    return next(err);
  }
}

// --- Manager team view -------------------------------------------------------

async function getTeamAttendance(req, res, next) {
  try {
    const { date } = req.query;
    const team = await attendanceService.getTeamAttendance(req.companyId, req.user.id, { date });
    return ok(res, { team });
  } catch (err) {
    return next(err);
  }
}

// --- Admin / HR company-wide views -------------------------------------------

async function listCompanyAttendance(req, res, next) {
  try {
    const { employeeId, departmentId, dateFrom, dateTo, status, page, pageSize } = req.query;
    const result = await attendanceService.listCompanyAttendance(req.companyId, {
      employeeId, departmentId, dateFrom, dateTo, status, page, pageSize,
    });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function listLate(req, res, next) {
  try {
    const employees = await attendanceService.listLate(req.companyId, req.query.date);
    return ok(res, { employees });
  } catch (err) {
    return next(err);
  }
}

async function listAbsent(req, res, next) {
  try {
    const employees = await attendanceService.listAbsent(req.companyId, req.query.date);
    return ok(res, { employees });
  } catch (err) {
    return next(err);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const stats = await attendanceService.getDashboardStats(req.companyId, req.query.date);
    return ok(res, { stats });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  clockIn,
  clockOut,
  getMyToday,
  getMyHistory,
  getMySummary,
  getTeamAttendance,
  listCompanyAttendance,
  listLate,
  listAbsent,
  getDashboardStats,
};
