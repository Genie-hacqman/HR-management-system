const jwtUtil = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const userModel = require('../models/userModel');
const roleModel = require('../models/roleModel');

/**
 * Verifies the JWT access token from the Authorization header, loads the
 * current user + roles + permissions fresh from the DB (never trusting a
 * stale token payload for authorization decisions), and attaches:
 *   req.user        -> { id, companyId, email, firstName, lastName, status }
 *   req.user.roles       -> ['company_admin', ...]
 *   req.user.permissions -> ['employees:manage', ...]
 *
 * IMPORTANT: req.user.companyId is the ONLY source of truth for which
 * company a request belongs to. Never read company_id from the request
 * body/query/params when scoping data.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication token is missing');
    }

    let payload;
    try {
      payload = jwtUtil.verifyAccessToken(token);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired authentication token');
    }

    const user = await userModel.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }
    if (user.status !== 'active') {
      throw new ApiError(403, 'This account is not active');
    }

    const [roles, permissions] = await Promise.all([
      roleModel.getRolesForUser(user.id),
      roleModel.getPermissionsForUser(user.id),
    ]);

    req.user = {
      id: user.id,
      companyId: user.company_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      roles: roles.map((r) => r.slug),
      permissions,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
