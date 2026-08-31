const { ApiError } = require('../utils/apiResponse');

/**
 * Usage: roleMiddleware('super_admin', 'company_admin')
 * Must run AFTER authMiddleware (relies on req.user.roles).
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = roleMiddleware;
