const dashboardService = require('../services/dashboardService');
const { ok } = require('../utils/apiResponse');

async function getAdminDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getAdminDashboard(req.companyId);
    return ok(res, { dashboard });
  } catch (err) {
    return next(err);
  }
}

async function getManagerDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getManagerDashboard(req.companyId, req.user.id);
    return ok(res, { dashboard });
  } catch (err) {
    return next(err);
  }
}

async function getEmployeeDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getEmployeeDashboard(req.companyId, req.user.id);
    return ok(res, { dashboard });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAdminDashboard, getManagerDashboard, getEmployeeDashboard };
