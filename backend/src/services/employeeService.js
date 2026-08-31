const employeeModel = require('../models/employeeModel');
const departmentModel = require('../models/departmentModel');
const positionModel = require('../models/positionModel');
const userModel = require('../models/userModel');
const { ApiError } = require('../utils/apiResponse');

const VALID_STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];

/** Confirms department/position/manager (if given) all belong to the SAME company as the employee. */
async function assertRelationsBelongToCompany(companyId, { departmentId, positionId, managerId }) {
  if (departmentId) {
    const dept = await departmentModel.findByIdAndCompany(departmentId, companyId);
    if (!dept) throw new ApiError(422, 'department_id does not refer to a department in this company');
  }
  if (positionId) {
    const pos = await positionModel.findByIdAndCompany(positionId, companyId);
    if (!pos) throw new ApiError(422, 'position_id does not refer to a position in this company');
  }
  if (managerId) {
    const manager = await employeeModel.findByIdAndCompany(managerId, companyId);
    if (!manager) throw new ApiError(422, 'manager_id does not refer to an employee in this company');
  }
}

async function createEmployee(companyId, payload) {
  const existing = await employeeModel.findByEmailAndCompany(payload.email, companyId);
  if (existing) {
    throw new ApiError(409, 'An employee with this email already exists in this company');
  }
  if (payload.userId) {
    const user = await userModel.findByIdAndCompany(payload.userId, companyId);
    if (!user) throw new ApiError(422, 'user_id does not refer to a user account in this company');
  }
  await assertRelationsBelongToCompany(companyId, {
    departmentId: payload.departmentId,
    positionId: payload.positionId,
    managerId: payload.managerId,
  });
  return employeeModel.create(companyId, payload);
}

async function listEmployees(companyId, filters) {
  return employeeModel.listByCompany(companyId, filters);
}

async function getEmployee(companyId, id) {
  const employee = await employeeModel.findByIdAndCompany(id, companyId);
  if (!employee) throw new ApiError(404, 'Employee not found');
  return employee;
}

async function updateEmployee(companyId, id, fields) {
  const employee = await getEmployee(companyId, id);

  if (fields.manager_id && Number(fields.manager_id) === employee.id) {
    throw new ApiError(422, 'An employee cannot be their own manager');
  }

  await assertRelationsBelongToCompany(companyId, {
    departmentId: fields.department_id,
    positionId: fields.position_id,
    managerId: fields.manager_id,
  });

  if (fields.email && fields.email !== employee.email) {
    const emailTaken = await employeeModel.findByEmailAndCompany(fields.email, companyId);
    if (emailTaken) throw new ApiError(409, 'Another employee already uses this email');
  }

  return employeeModel.update(id, companyId, fields);
}

async function setEmployeeStatus(companyId, id, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(422, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  await getEmployee(companyId, id);
  return employeeModel.setStatus(id, companyId, status);
}

async function deactivateEmployee(companyId, id) {
  await getEmployee(companyId, id);
  await employeeModel.softDelete(id, companyId);
}

/** Returns the employee record + direct reports for the Manager Dashboard / "View team" feature. */
async function getMyTeam(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    return { manager: null, reports: [] };
  }
  const reports = await employeeModel.listDirectReports(companyId, employee.id);
  return { manager: employee, reports };
}

/** The employee record linked to the caller's own login account ("My profile"). */
async function getMyProfile(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account');
  }
  return employee;
}

/**
 * Self-service profile update — spec: "Employees can view and update
 * their profile where permitted." Only a safe subset of fields is
 * editable by the employee themselves; department, position, salary,
 * manager, and employment status remain admin-only via updateEmployee.
 */
const SELF_EDITABLE_FIELDS = [
  'phone', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'profile_photo_url',
];

async function updateMyProfile(companyId, userId, fields) {
  const employee = await getMyProfile(companyId, userId);
  const safeFields = {};
  for (const key of Object.keys(fields)) {
    if (SELF_EDITABLE_FIELDS.includes(key)) safeFields[key] = fields[key];
  }
  return employeeModel.update(employee.id, companyId, safeFields);
}

async function getDepartmentDistribution(companyId) {
  return employeeModel.countByDepartment(companyId);
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  setEmployeeStatus,
  deactivateEmployee,
  getMyTeam,
  getMyProfile,
  updateMyProfile,
  getDepartmentDistribution,
  VALID_STATUSES,
};
