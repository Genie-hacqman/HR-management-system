const reportService = require('../services/reportService');
const { toCSV } = require('../utils/csv');
const { ok } = require('../utils/apiResponse');

function respond(req, res, { columns, rows, summary }, filename) {
  if (req.query.format === 'csv') {
    const csv = toCSV(rows, columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  }
  return ok(res, { rows, summary });
}

async function employeeReport(req, res, next) {
  try {
    const { departmentId, status } = req.query;
    const report = await reportService.employeeReport(req.companyId, { departmentId, status });
    return respond(req, res, report, 'employee-report.csv');
  } catch (err) {
    return next(err);
  }
}

async function attendanceReport(req, res, next) {
  try {
    const { dateFrom, dateTo, departmentId, status, employeeId } = req.query;
    const report = await reportService.attendanceReport(req.companyId, { dateFrom, dateTo, departmentId, status, employeeId });
    return respond(req, res, report, 'attendance-report.csv');
  } catch (err) {
    return next(err);
  }
}

async function leaveReport(req, res, next) {
  try {
    const { dateFrom, dateTo, departmentId, status, employeeId } = req.query;
    const report = await reportService.leaveReport(req.companyId, { dateFrom, dateTo, departmentId, status, employeeId });
    return respond(req, res, report, 'leave-report.csv');
  } catch (err) {
    return next(err);
  }
}

async function payrollReport(req, res, next) {
  try {
    const report = await reportService.payrollReport(req.companyId, req.query.payrollId);
    return respond(req, res, report, 'payroll-report.csv');
  } catch (err) {
    return next(err);
  }
}

async function recruitmentReport(req, res, next) {
  try {
    const { status, jobPostingId } = req.query;
    const report = await reportService.recruitmentReport(req.companyId, { status, jobPostingId });
    return respond(req, res, report, 'recruitment-report.csv');
  } catch (err) {
    return next(err);
  }
}

async function performanceReport(req, res, next) {
  try {
    const { status, employeeId } = req.query;
    const report = await reportService.performanceReport(req.companyId, { status, employeeId });
    return respond(req, res, report, 'performance-report.csv');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  employeeReport,
  attendanceReport,
  leaveReport,
  payrollReport,
  recruitmentReport,
  performanceReport,
};
