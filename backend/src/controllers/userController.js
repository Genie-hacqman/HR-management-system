const userService = require('../services/userService');
const roleModel = require('../models/roleModel');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

/** GET /api/users — list users in the authenticated admin's own company. */
async function listUsers(req, res, next) {
  try {
    const { search, status } = req.query;
    const users = await userService.listCompanyUsers(req.companyId, { search, status });
    return ok(res, { users });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/users/:id */
async function getUser(req, res, next) {
  try {
    const user = await userService.getCompanyUser(req.companyId, req.params.id);
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/users/invite — Company Admin invites a Manager/Employee/Admin into their own company. */
async function inviteUser(req, res, next) {
  try {
    const user = await userService.inviteUser(req.companyId, req.body);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'user.invited',
      resource: 'users',
      resourceId: user.id,
      ipAddress: req.ip,
      newValue: { email: user.email, roles: req.body.roles },
    });
    return created(res, { user }, 'User invited. They will receive an email to set their password.');
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/users/:id/roles — replace a user's role set. */
async function setRoles(req, res, next) {
  try {
    const before = await userService.getCompanyUser(req.companyId, req.params.id);
    const user = await userService.setUserRoles(req.companyId, req.params.id, req.body.roles);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'user.roles.changed',
      resource: 'users',
      resourceId: req.params.id,
      ipAddress: req.ip,
      previousValue: { roles: before.roles },
      newValue: { roles: user.roles },
    });
    return ok(res, { user }, 'User roles updated');
  } catch (err) {
    return next(err);
  }
}

/** POST /api/users/:id/permissions — grant one extra permission (e.g. a Manager gaining employees:manage). */
async function grantPermission(req, res, next) {
  try {
    const user = await userService.grantPermission(req.companyId, req.params.id, req.body.permission);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'user.permission.granted',
      resource: 'users',
      resourceId: req.params.id,
      ipAddress: req.ip,
      newValue: { permission: req.body.permission },
    });
    return ok(res, { user }, 'Permission granted');
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/users/:id/permissions — revoke a directly-granted permission. */
async function revokePermission(req, res, next) {
  try {
    const user = await userService.revokePermission(req.companyId, req.params.id, req.body.permission);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'user.permission.revoked',
      resource: 'users',
      resourceId: req.params.id,
      ipAddress: req.ip,
      previousValue: { permission: req.body.permission },
    });
    return ok(res, { user }, 'Permission revoked');
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/users/:id/status — activate / deactivate / suspend a user. */
async function setStatus(req, res, next) {
  try {
    const before = await userService.getCompanyUser(req.companyId, req.params.id);
    const updated = await userService.setUserStatus(req.companyId, req.params.id, req.body.status);
    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'user.status.changed',
      resource: 'users',
      resourceId: req.params.id,
      ipAddress: req.ip,
      previousValue: { status: before.status },
      newValue: { status: updated.status },
    });
    return ok(res, { user: updated }, 'User status updated');
  } catch (err) {
    return next(err);
  }
}

/** GET /api/roles — catalog of assignable roles (excludes super_admin). */
async function listRoles(req, res, next) {
  try {
    const roles = await roleModel.listAssignableRoles();
    return ok(res, { roles });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/permissions — full permission catalog. */
async function listPermissions(req, res, next) {
  try {
    const permissions = await roleModel.listAllPermissions();
    return ok(res, { permissions });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  inviteUser,
  setRoles,
  grantPermission,
  revokePermission,
  setStatus,
  listRoles,
  listPermissions,
};
