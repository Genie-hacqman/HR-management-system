const leaveTypeModel = require('../models/leaveTypeModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const employeeModel = require('../models/employeeModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

async function requireEmployeeForUser(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account, so leave cannot be requested');
  }
  return employee;
}

/** Inclusive calendar-day count between two ISO date strings. */
function countDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// --- Leave types (company_admin configurable) -------------------------------

async function listLeaveTypes(companyId) {
  return leaveTypeModel.listByCompany(companyId);
}

async function createLeaveType(companyId, payload) {
  const existing = await leaveTypeModel.findByNameAndCompany(payload.name, companyId);
  if (existing) throw new ApiError(409, 'A leave type with this name already exists');
  return leaveTypeModel.create(companyId, payload);
}

async function updateLeaveType(companyId, id, fields) {
  const existing = await leaveTypeModel.findByIdAndCompany(id, companyId);
  if (!existing) throw new ApiError(404, 'Leave type not found');
  return leaveTypeModel.update(id, companyId, fields);
}

async function archiveLeaveType(companyId, id) {
  const existing = await leaveTypeModel.findByIdAndCompany(id, companyId);
  if (!existing) throw new ApiError(404, 'Leave type not found');
  await leaveTypeModel.softDelete(id, companyId);
}

// --- Employee self-service --------------------------------------------------

async function getMyBalances(companyId, userId, year = new Date().getFullYear()) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return leaveBalanceModel.listForEmployee(companyId, employee.id, year);
}

async function submitRequest(companyId, userId, { leaveTypeId, startDate, endDate, reason, supportingDocumentUrl }) {
  const employee = await requireEmployeeForUser(companyId, userId);

  const leaveType = await leaveTypeModel.findByIdAndCompany(leaveTypeId, companyId);
  if (!leaveType) throw new ApiError(422, 'leave_type_id does not refer to a leave type in this company');

  if (new Date(endDate) < new Date(startDate)) {
    throw new ApiError(422, 'endDate must be on or after startDate');
  }
  if (leaveType.requires_document && !supportingDocumentUrl) {
    throw new ApiError(422, `${leaveType.name} requires a supporting document`);
  }

  const overlapping = await leaveRequestModel.findOverlapping(employee.id, startDate, endDate);
  if (overlapping.length > 0) {
    throw new ApiError(409, 'You already have a pending or approved leave request that overlaps these dates');
  }

  const totalDays = countDays(startDate, endDate);

  // Paid leave types are checked against the employee's remaining balance;
  // unpaid/zero-allocation types (Unpaid Leave, Other) are not balance-limited.
  if (leaveType.is_paid && Number(leaveType.default_days_per_year) > 0) {
    const year = new Date(startDate).getFullYear();
    const balance = await leaveBalanceModel.getOrCreate(companyId, employee.id, leaveType, year);
    const remaining = Number(balance.allocated_days) - Number(balance.used_days);
    if (totalDays > remaining) {
      throw new ApiError(422, `This request (${totalDays} day(s)) exceeds your remaining ${leaveType.name} balance (${remaining} day(s))`);
    }
  }

  return leaveRequestModel.create(companyId, {
    employeeId: employee.id, leaveTypeId, startDate, endDate, totalDays, reason, supportingDocumentUrl,
  }).then(async (request) => {
    // Notify the employee's manager (or HR if they have none) that a request is waiting.
    const notifyPayload = {
      type: 'leave_request',
      title: `${employee.first_name} ${employee.last_name} requested leave`,
      message: `${leaveType.name}: ${startDate} to ${endDate} (${totalDays} day(s))`,
      link: '/dashboard/team-leave',
    };
    if (employee.manager_id) {
      await notificationService.notifyManagerOf(companyId, employee, notifyPayload);
    } else {
      await notificationService.notifyCompanyAdmins(companyId, { ...notifyPayload, link: '/dashboard/leave' });
    }
    return request;
  });
}

async function getMyRequests(companyId, userId, filters) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return leaveRequestModel.listForEmployee(employee.id, filters);
}

async function cancelMyRequest(companyId, userId, requestId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  const request = await leaveRequestModel.findByIdAndCompany(requestId, companyId);
  if (!request || request.employee_id !== employee.id) {
    throw new ApiError(404, 'Leave request not found');
  }
  if (request.status !== 'pending') {
    throw new ApiError(422, 'Only pending requests can be cancelled');
  }
  return leaveRequestModel.cancel(requestId, companyId);
}

// --- Manager / HR review ----------------------------------------------------

async function listCompanyRequests(companyId, filters) {
  return leaveRequestModel.listByCompany(companyId, filters);
}

async function listTeamRequests(companyId, userId, filters) {
  const managerEmployee = await employeeModel.findByUserId(userId);
  if (!managerEmployee || managerEmployee.company_id !== companyId) return [];
  return leaveRequestModel.listForManagerTeam(companyId, managerEmployee.id, filters);
}

async function getCalendar(companyId, { dateFrom, dateTo }) {
  if (!dateFrom || !dateTo) throw new ApiError(422, 'dateFrom and dateTo are required');
  return leaveRequestModel.listCalendar(companyId, { dateFrom, dateTo });
}

async function approveRequest(companyId, reviewerUserId, requestId) {
  const request = await leaveRequestModel.findByIdAndCompany(requestId, companyId);
  if (!request) throw new ApiError(404, 'Leave request not found');
  if (request.status !== 'pending') throw new ApiError(422, 'Only pending requests can be approved');

  const leaveType = await leaveTypeModel.findByIdAndCompany(request.leave_type_id, companyId);
  if (leaveType.is_paid && Number(leaveType.default_days_per_year) > 0) {
    const year = new Date(request.start_date).getFullYear();
    const balance = await leaveBalanceModel.getOrCreate(companyId, request.employee_id, leaveType, year);
    const remaining = Number(balance.allocated_days) - Number(balance.used_days);
    if (Number(request.total_days) > remaining) {
      throw new ApiError(422, `Approving this would exceed the employee's remaining ${leaveType.name} balance (${remaining} day(s))`);
    }
    await leaveBalanceModel.adjustUsedDays(request.employee_id, request.leave_type_id, year, Number(request.total_days));
  }

  return leaveRequestModel.setStatus(requestId, companyId, { status: 'approved', reviewedBy: reviewerUserId })
    .then(async (request) => {
      const employee = await employeeModel.findByIdAndCompany(request.employee_id, companyId);
      await notificationService.notifyEmployee(companyId, employee, {
        type: 'leave_approved',
        title: 'Your leave request was approved',
        message: `${request.start_date} to ${request.end_date}`,
        link: '/dashboard/my-leave',
      });
      return request;
    });
}

async function rejectRequest(companyId, reviewerUserId, requestId, reason) {
  const request = await leaveRequestModel.findByIdAndCompany(requestId, companyId);
  if (!request) throw new ApiError(404, 'Leave request not found');
  if (request.status !== 'pending') throw new ApiError(422, 'Only pending requests can be rejected');
  if (!reason) throw new ApiError(422, 'A rejection reason is required');

  return leaveRequestModel.setStatus(requestId, companyId, { status: 'rejected', reviewedBy: reviewerUserId, reviewerNotes: reason })
    .then(async (request) => {
      const employee = await employeeModel.findByIdAndCompany(request.employee_id, companyId);
      await notificationService.notifyEmployee(companyId, employee, {
        type: 'leave_rejected',
        title: 'Your leave request was rejected',
        message: reason,
        link: '/dashboard/my-leave',
      });
      return request;
    });
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
  listCompanyRequests,
  listTeamRequests,
  getCalendar,
  approveRequest,
  rejectRequest,
};
