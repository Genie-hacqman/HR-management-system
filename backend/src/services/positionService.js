const positionModel = require('../models/positionModel');
const departmentModel = require('../models/departmentModel');
const { ApiError } = require('../utils/apiResponse');

async function createPosition(companyId, payload) {
  const existing = await positionModel.findByTitleAndCompany(payload.title, companyId);
  if (existing) {
    throw new ApiError(409, 'A position with this title already exists');
  }
  if (payload.departmentId) {
    const department = await departmentModel.findByIdAndCompany(payload.departmentId, companyId);
    if (!department) throw new ApiError(422, 'department_id does not refer to a department in this company');
  }
  return positionModel.create(companyId, payload);
}

async function listPositions(companyId, filters) {
  return positionModel.listByCompany(companyId, filters);
}

async function getPosition(companyId, id) {
  const position = await positionModel.findByIdAndCompany(id, companyId);
  if (!position) throw new ApiError(404, 'Position not found');
  return position;
}

async function updatePosition(companyId, id, fields) {
  await getPosition(companyId, id);
  if (fields.department_id) {
    const department = await departmentModel.findByIdAndCompany(fields.department_id, companyId);
    if (!department) throw new ApiError(422, 'department_id does not refer to a department in this company');
  }
  return positionModel.update(id, companyId, fields);
}

async function deletePosition(companyId, id) {
  await getPosition(companyId, id);
  await positionModel.softDelete(id, companyId);
}

module.exports = { createPosition, listPositions, getPosition, updatePosition, deletePosition };
