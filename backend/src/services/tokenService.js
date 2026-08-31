const env = require('../config/env');
const jwtUtil = require('../utils/jwt');
const userModel = require('../models/userModel');
const roleModel = require('../models/roleModel');

function refreshExpiryDate() {
  // Mirrors JWT_REFRESH_EXPIRES_IN for DB bookkeeping (defaults to 7 days).
  const days = parseInt(env.jwt.refreshExpiresIn, 10) || 7;
  const ms = env.jwt.refreshExpiresIn.endsWith('d') ? days * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

async function issueTokenPair(user) {
  const roles = await roleModel.getRolesForUser(user.id);
  const roleSlugs = roles.map((r) => r.slug);

  const accessToken = jwtUtil.signAccessToken({
    userId: user.id,
    companyId: user.company_id,
    roles: roleSlugs,
  });
  const refreshToken = jwtUtil.signRefreshToken({ userId: user.id });

  await userModel.saveRefreshToken(
    user.id,
    jwtUtil.hashToken(refreshToken),
    refreshExpiryDate()
  );

  return { accessToken, refreshToken, roles: roleSlugs };
}

async function rotateRefreshToken(oldRefreshToken) {
  const payload = jwtUtil.verifyRefreshToken(oldRefreshToken); // throws if invalid/expired
  const tokenHash = jwtUtil.hashToken(oldRefreshToken);
  const stored = await userModel.findRefreshToken(tokenHash);
  if (!stored) {
    throw Object.assign(new Error('Refresh token is invalid or has been revoked'), { statusCode: 401 });
  }

  const user = await userModel.findById(payload.sub);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  // Rotate: revoke the old token, issue a new pair.
  await userModel.revokeRefreshToken(tokenHash);
  return issueTokenPair(user);
}

module.exports = { issueTokenPair, rotateRefreshToken };
