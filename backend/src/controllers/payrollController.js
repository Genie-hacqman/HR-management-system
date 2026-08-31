const payrollService = require('../services/payrollService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

// --- Payroll period workflow (Company Admin / HR) ---------------------------

async function createPeriod(req, res, next) {
  try {
    const payroll = await payrollService.createPeriod(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.period.created',
      resource: 'payroll', resourceId: payroll.id, ipAddress: req.ip,
      newValue: { period_start: payroll.period_start, period_end: payroll.period_end },
    });
    return created(res, { payroll }, 'Payroll period created');
  } catch (err) {
    return next(err);
  }
}

async function listPeriods(req, res, next) {
  try {
    const { status, page, pageSize } = req.query;
    const result = await payrollService.listPeriods(req.companyId, { status, page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getPeriod(req, res, next) {
  try {
    const result = await payrollService.getPeriodWithItems(req.companyId, req.params.id);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function calculatePeriod(req, res, next) {
  try {
    const payroll = await payrollService.calculatePeriod(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.period.calculated',
      resource: 'payroll', resourceId: payroll.id, ipAddress: req.ip,
    });
    return ok(res, { payroll }, 'Payroll calculated');
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await payrollService.updateItem(req.companyId, req.params.payrollId, req.params.itemId, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.item.updated',
      resource: 'payroll_items', resourceId: item.id, ipAddress: req.ip, newValue: item,
    });
    return ok(res, { item }, 'Payroll item updated');
  } catch (err) {
    return next(err);
  }
}

async function markReviewed(req, res, next) {
  try {
    const payroll = await payrollService.markReviewed(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.period.reviewed',
      resource: 'payroll', resourceId: payroll.id, ipAddress: req.ip,
    });
    return ok(res, { payroll }, 'Payroll marked as reviewed');
  } catch (err) {
    return next(err);
  }
}

async function approvePeriod(req, res, next) {
  try {
    const payroll = await payrollService.approvePeriod(req.companyId, req.user.id, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.period.approved',
      resource: 'payroll', resourceId: payroll.id, ipAddress: req.ip,
    });
    return ok(res, { payroll }, 'Payroll approved');
  } catch (err) {
    return next(err);
  }
}

async function processPeriod(req, res, next) {
  try {
    const payroll = await payrollService.processPeriod(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'payroll.period.processed',
      resource: 'payroll', resourceId: payroll.id, ipAddress: req.ip,
    });
    return ok(res, { payroll }, 'Payroll processed and payslips generated');
  } catch (err) {
    return next(err);
  }
}

// --- Employee self-service --------------------------------------------------

async function getMyPayslips(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await payrollService.getMyPayslips(req.companyId, req.user.id, { page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getMyPayslip(req, res, next) {
  try {
    const payslip = await payrollService.getMyPayslip(req.companyId, req.user.id, req.params.id);
    return ok(res, { payslip });
  } catch (err) {
    return next(err);
  }
}

async function getMySalaryHistory(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const result = await payrollService.getMySalaryHistory(req.companyId, req.user.id, { page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createPeriod,
  listPeriods,
  getPeriod,
  calculatePeriod,
  updateItem,
  markReviewed,
  approvePeriod,
  processPeriod,
  getMyPayslips,
  getMyPayslip,
  getMySalaryHistory,
};
