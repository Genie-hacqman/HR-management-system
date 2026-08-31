const departmentModel = require('../models/departmentModel');
const employeeModel = require('../models/employeeModel');
const { ApiError } = require('../utils/apiResponse');

async function createDepartment(companyId, payload) {
  const existing = await departmentModel.findByNameAndCompany(payload.name, companyId);
  if (existing) {
    throw new ApiError(409, 'A department with this name already exists');
  }
  if (payload.managerId) {
    const manager = await employeeModel.findByIdAndCompany(payload.managerId, companyId);
    if (!manager) throw new ApiError(422, 'manager_id does not refer to an employee in this company');
  }
  return departmentModel.create(companyId, payload);
}

async function listDepartments(companyId, filters) {
  return departmentModel.listByCompany(companyId, filters);
}

async function getDepartment(companyId, id) {
  const department = await departmentModel.findByIdAndCompany(id, companyId);
  if (!department) throw new ApiError(404, 'Department not found');
  return department;
}

async function updateDepartment(companyId, id, fields) {
  await getDepartment(companyId, id);
  if (fields.manager_id) {
    const manager = await employeeModel.findByIdAndCompany(fields.manager_id, companyId);
    if (!manager) throw new ApiError(422, 'manager_id does not refer to an employee in this company');
  }
  return departmentModel.update(id, companyId, fields);
}

async function deleteDepartment(companyId, id) {
  await getDepartment(companyId, id);
  await departmentModel.softDelete(id, companyId);
}

module.exports = { createDepartment, listDepartments, getDepartment, updateDepartment, deleteDepartment };
