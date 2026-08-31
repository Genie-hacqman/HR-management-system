const crypto = require('crypto');
const { ApiError } = require('../utils/apiResponse');
const { hashPassword } = require('../utils/password');
const userModel = require('../models/userModel');
const roleModel = require('../models/roleModel');
const mailer = require('./mailerService');

const ASSIGNABLE_ROLES = ['company_admin', 'manager', 'employee'];

function assertAssignableRoles(roleSlugs) {
  const invalid = roleSlugs.filter((r) => !ASSIGNABLE_ROLES.includes(r));
  if (invalid.length > 0) {
    throw new ApiError(422, `These roles cannot be assigned within a company: ${invalid.join(', ')}`);
  }
}

/**
 * Invites a new user into the CALLER'S company only. companyId must come
 * from req.companyId (the authenticated admin's own company) — never
 * from the request body — so this can never create a user in another
 * tenant.
 */
async function inviteUser(companyId, { firstName, lastName, email, roles }) {
  assertAssignableRoles(roles);

  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // Temporary random password — the invitee sets their own via the same
  // "forgot password" flow, emailed immediately as a "set your password" link.
  const temporaryPassword = crypto.randomBytes(24).toString('hex');
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await userModel.create({ companyId, firstName, lastName, email, passwordHash });

  for (const roleSlug of roles) {
    const role = await roleModel.findBySlug(roleSlug);
    if (role) {
      await roleModel.assignRoleToUser({ userId: user.id, roleId: role.id, companyId });
    }
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h to accept invite
  await userModel.setPasswordResetToken(user.id, resetToken, expiresAt);
  await mailer.sendPasswordResetEmail(user.email, resetToken);

  return userModel.findById(user.id);
}

async function listCompanyUsers(companyId, filters) {
  return userModel.listByCompany(companyId, filters);
}

async function getCompanyUser(companyId, userId) {
  const user = await userModel.findByIdAndCompany(userId, companyId);
  if (!user) {
    throw new ApiError(404, 'User not found in this company');
  }
  const [roles, permissions] = await Promise.all([
    roleModel.getRolesForUser(user.id),
    roleModel.getDirectPermissionsForUser(user.id),
  ]);
  return { ...user, roles: roles.map((r) => r.slug), directPermissions: permissions };
}

async function setUserRoles(companyId, userId, roleSlugs) {
  assertAssignableRoles(roleSlugs);
  const user = await userModel.findByIdAndCompany(userId, companyId);
  if (!user) {
    throw new ApiError(404, 'User not found in this company');
  }
  await roleModel.replaceUserRoles(userId, companyId, roleSlugs);
  return getCompanyUser(companyId, userId);
}

async function grantPermission(companyId, userId, permissionSlug) {
  const user = await userModel.findByIdAndCompany(userId, companyId);
  if (!user) {
    throw new ApiError(404, 'User not found in this company');
  }
  await roleModel.grantPermissionToUser(userId, permissionSlug);
  return getCompanyUser(companyId, userId);
}

async function revokePermission(companyId, userId, permissionSlug) {
  const user = await userModel.findByIdAndCompany(userId, companyId);
  if (!user) {
    throw new ApiError(404, 'User not found in this company');
  }
  await roleModel.revokePermissionFromUser(userId, permissionSlug);
  return getCompanyUser(companyId, userId);
}

async function setUserStatus(companyId, userId, status) {
  const allowed = ['active', 'inactive', 'suspended'];
  if (!allowed.includes(status)) {
    throw new ApiError(422, `status must be one of: ${allowed.join(', ')}`);
  }
  const user = await userModel.findByIdAndCompany(userId, companyId);
  if (!user) {
    throw new ApiError(404, 'User not found in this company');
  }
  const updated = await userModel.setStatus(userId, status);
  if (status !== 'active') {
    await userModel.revokeAllRefreshTokensForUser(userId);
  }
  return updated;
}

module.exports = {
  inviteUser,
  listCompanyUsers,
  getCompanyUser,
  setUserRoles,
  grantPermission,
  revokePermission,
  setUserStatus,
  ASSIGNABLE_ROLES,
};
