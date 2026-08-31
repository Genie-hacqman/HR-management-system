const leaveService = require('../services/leaveService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

// --- Leave types -------------------------------------------------------------

async function listLeaveTypes(req, res, next) {
  try {
    const types = await leaveService.listLeaveTypes(req.companyId);
    return ok(res, { leaveTypes: types });
  } catch (err) {
    return next(err);
  }
}

async function createLeaveType(req, res, next) {
  try {
    const leaveType = await leaveService.createLeaveType(req.companyId, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_type.created',
      resource: 'leave_types', resourceId: leaveType.id, ipAddress: req.ip, newValue: { name: leaveType.name },
    });
    return created(res, { leaveType }, 'Leave type created');
  } catch (err) {
    return next(err);
  }
}

async function updateLeaveType(req, res, next) {
  try {
    const leaveType = await leaveService.updateLeaveType(req.companyId, req.params.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_type.updated',
      resource: 'leave_types', resourceId: leaveType.id, ipAddress: req.ip, newValue: leaveType,
    });
    return ok(res, { leaveType }, 'Leave type updated');
  } catch (err) {
    return next(err);
  }
}

async function archiveLeaveType(req, res, next) {
  try {
    await leaveService.archiveLeaveType(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_type.archived',
      resource: 'leave_types', resourceId: req.params.id, ipAddress: req.ip,
    });
    return ok(res, null, 'Leave type archived');
  } catch (err) {
    return next(err);
  }
}

// --- Employee self-service --------------------------------------------------

async function getMyBalances(req, res, next) {
  try {
    const balances = await leaveService.getMyBalances(req.companyId, req.user.id, req.query.year);
    return ok(res, { balances });
  } catch (err) {
    return next(err);
  }
}

async function submitRequest(req, res, next) {
  try {
    const request = await leaveService.submitRequest(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_request.submitted',
      resource: 'leave_requests', resourceId: request.id, ipAddress: req.ip,
      newValue: { start_date: request.start_date, end_date: request.end_date, total_days: request.total_days },
    });
    return created(res, { request }, 'Leave request submitted');
  } catch (err) {
    return next(err);
  }
}

async function getMyRequests(req, res, next) {
  try {
    const { status, page, pageSize } = req.query;
    const result = await leaveService.getMyRequests(req.companyId, req.user.id, { status, page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function cancelMyRequest(req, res, next) {
  try {
    const request = await leaveService.cancelMyRequest(req.companyId, req.user.id, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_request.cancelled',
      resource: 'leave_requests', resourceId: request.id, ipAddress: req.ip,
    });
    return ok(res, { request }, 'Leave request cancelled');
  } catch (err) {
    return next(err);
  }
}

// --- Manager team view -------------------------------------------------------

async function listTeamRequests(req, res, next) {
  try {
    const { status } = req.query;
    const requests = await leaveService.listTeamRequests(req.companyId, req.user.id, { status });
    return ok(res, { requests });
  } catch (err) {
    return next(err);
  }
}

// --- Admin / HR review -------------------------------------------------------

async function listCompanyRequests(req, res, next) {
  try {
    const { status, employeeId, departmentId, dateFrom, dateTo, page, pageSize } = req.query;
    const result = await leaveService.listCompanyRequests(req.companyId, {
      status, employeeId, departmentId, dateFrom, dateTo, page, pageSize,
    });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getCalendar(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const requests = await leaveService.getCalendar(req.companyId, { dateFrom, dateTo });
    return ok(res, { requests });
  } catch (err) {
    return next(err);
  }
}

async function approveRequest(req, res, next) {
  try {
    const request = await leaveService.approveRequest(req.companyId, req.user.id, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_request.approved',
      resource: 'leave_requests', resourceId: request.id, ipAddress: req.ip,
    });
    return ok(res, { request }, 'Leave request approved');
  } catch (err) {
    return next(err);
  }
}

async function rejectRequest(req, res, next) {
  try {
    const request = await leaveService.rejectRequest(req.companyId, req.user.id, req.params.id, req.body.reason);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'leave_request.rejected',
      resource: 'leave_requests', resourceId: request.id, ipAddress: req.ip, newValue: { reason: req.body.reason },
    });
    return ok(res, { request }, 'Leave request rejected');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  archiveLeaveType,
  getMyBalances,
  submitRequest,
  getMyRequests,
  cancelMyRequest,
  listTeamRequests,
  listCompanyRequests,
  getCalendar,
  approveRequest,
  rejectRequest,
};
