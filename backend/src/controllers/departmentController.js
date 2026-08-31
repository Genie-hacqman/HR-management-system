const departmentService = require('../services/departmentService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

async function listDepartments(req, res, next) {
  try {
    const { search } = req.query;
    const departments = await departmentService.listDepartments(req.companyId, { search });
    return ok(res, { departments });
  } catch (err) {
    return next(err);
  }
}

async function getDepartment(req, res, next) {
  try {
    const department = await departmentService.getDepartment(req.companyId, req.params.id);
    return ok(res, { department });
  } catch (err) {
    return next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const department = await departmentService.createDepartment(req.companyId, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'department.created',
      resource: 'departments',
      resourceId: department.id,
      ipAddress: req.ip,
      newValue: { name: department.name },
    });
    return created(res, { department }, 'Department created');
  } catch (err) {
    return next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const before = await departmentService.getDepartment(req.companyId, req.params.id);
    const department = await departmentService.updateDepartment(req.companyId, req.params.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'department.updated',
      resource: 'departments',
      resourceId: department.id,
      ipAddress: req.ip,
      previousValue: before,
      newValue: department,
    });
    return ok(res, { department }, 'Department updated');
  } catch (err) {
    return next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    await departmentService.deleteDepartment(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'department.archived',
      resource: 'departments',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    return ok(res, null, 'Department archived');
  } catch (err) {
    return next(err);
  }
}

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
