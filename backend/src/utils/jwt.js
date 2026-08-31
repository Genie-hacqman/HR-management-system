const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Access token payload is intentionally minimal: userId, companyId, and
 * role slugs. Permissions are re-resolved from the DB on sensitive
 * operations, never trusted purely from a stale token payload.
 */
function signAccessToken({ userId, companyId, roles }) {
  return jwt.sign(
    { sub: userId, companyId: companyId ?? null, roles },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function signRefreshToken({ userId }) {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/** Hash refresh tokens before storing them (never store raw tokens). */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
};
