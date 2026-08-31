const employeeService = require('../services/employeeService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

/** GET /api/employees — search/filter/sort/paginate within the caller's own company. */
async function listEmployees(req, res, next) {
  try {
    const {
      search, departmentId, positionId, managerId, status,
      sortBy, sortDir, page, pageSize,
    } = req.query;
    const result = await employeeService.listEmployees(req.companyId, {
      search, departmentId, positionId, managerId, status, sortBy, sortDir, page, pageSize,
    });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

/** GET /api/employees/:id */
async function getEmployee(req, res, next) {
  try {
    const employee = await employeeService.getEmployee(req.companyId, req.params.id);
    return ok(res, { employee });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/employees */
async function createEmployee(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(req.companyId, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'employee.created',
      resource: 'employees',
      resourceId: employee.id,
      ipAddress: req.ip,
      newValue: { employee_code: employee.employee_code, email: employee.email },
    });
    return created(res, { employee }, 'Employee added');
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/employees/:id */
async function updateEmployee(req, res, next) {
  try {
    const before = await employeeService.getEmployee(req.companyId, req.params.id);
    const employee = await employeeService.updateEmployee(req.companyId, req.params.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'employee.updated',
      resource: 'employees',
      resourceId: employee.id,
      ipAddress: req.ip,
      previousValue: before,
      newValue: employee,
    });
    return ok(res, { employee }, 'Employee updated');
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/employees/:id/status — e.g. mark On Leave, Suspended, Resigned, Terminated. */
async function setStatus(req, res, next) {
  try {
    const before = await employeeService.getEmployee(req.companyId, req.params.id);
    const employee = await employeeService.setEmployeeStatus(req.companyId, req.params.id, req.body.status);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'employee.status.changed',
      resource: 'employees',
      resourceId: employee.id,
      ipAddress: req.ip,
      previousValue: { employment_status: before.employment_status },
      newValue: { employment_status: employee.employment_status },
    });
    return ok(res, { employee }, 'Employee status updated');
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/employees/:id — soft-deactivate (spec: "Deactivate employee", never a hard delete). */
async function deactivateEmployee(req, res, next) {
  try {
    await employeeService.deactivateEmployee(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'employee.deactivated',
      resource: 'employees',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    return ok(res, null, 'Employee deactivated');
  } catch (err) {
    return next(err);
  }
}

/** GET /api/employees/me/team — Manager Dashboard "View their team". */
async function getMyTeam(req, res, next) {
  try {
    const result = await employeeService.getMyTeam(req.companyId, req.user.id);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

/** GET /api/employees/me — the caller's own employee profile. */
async function getMyProfile(req, res, next) {
  try {
    const employee = await employeeService.getMyProfile(req.companyId, req.user.id);
    return ok(res, { employee });
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/employees/me — self-service update of a limited field set. */
async function updateMyProfile(req, res, next) {
  try {
    const employee = await employeeService.updateMyProfile(req.companyId, req.user.id, req.body);
    return ok(res, { employee }, 'Profile updated');
  } catch (err) {
    return next(err);
  }
}

/** GET /api/employees/stats/department-distribution — Admin Dashboard chart data. */
async function getDepartmentDistribution(req, res, next) {
  try {
    const distribution = await employeeService.getDepartmentDistribution(req.companyId);
    return ok(res, { distribution });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/employees/:id/history — the employee's audit trail (spec: "Employee history"). */
async function getEmployeeHistory(req, res, next) {
  try {
    await employeeService.getEmployee(req.companyId, req.params.id); // 404s if not in this company
    const history = await auditLogModel.list({
      companyId: req.companyId,
      resource: 'employees',
      resourceId: req.params.id,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, { history });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  setStatus,
  deactivateEmployee,
  getMyTeam,
  getMyProfile,
  updateMyProfile,
  getDepartmentDistribution,
  getEmployeeHistory,
};
