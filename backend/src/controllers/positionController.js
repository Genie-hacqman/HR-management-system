const positionService = require('../services/positionService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

async function listPositions(req, res, next) {
  try {
    const { search, departmentId } = req.query;
    const positions = await positionService.listPositions(req.companyId, { search, departmentId });
    return ok(res, { positions });
  } catch (err) {
    return next(err);
  }
}

async function getPosition(req, res, next) {
  try {
    const position = await positionService.getPosition(req.companyId, req.params.id);
    return ok(res, { position });
  } catch (err) {
    return next(err);
  }
}

async function createPosition(req, res, next) {
  try {
    const position = await positionService.createPosition(req.companyId, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'position.created',
      resource: 'positions',
      resourceId: position.id,
      ipAddress: req.ip,
      newValue: { title: position.title },
    });
    return created(res, { position }, 'Position created');
  } catch (err) {
    return next(err);
  }
}

async function updatePosition(req, res, next) {
  try {
    const before = await positionService.getPosition(req.companyId, req.params.id);
    const position = await positionService.updatePosition(req.companyId, req.params.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'position.updated',
      resource: 'positions',
      resourceId: position.id,
      ipAddress: req.ip,
      previousValue: before,
      newValue: position,
    });
    return ok(res, { position }, 'Position updated');
  } catch (err) {
    return next(err);
  }
}

async function deletePosition(req, res, next) {
  try {
    await positionService.deletePosition(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'position.archived',
      resource: 'positions',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    return ok(res, null, 'Position archived');
  } catch (err) {
    return next(err);
  }
}

module.exports = { listPositions, getPosition, createPosition, updatePosition, deletePosition };
