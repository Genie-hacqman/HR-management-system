const { ApiError } = require('../utils/apiResponse');

/**
 * Usage: permissionMiddleware('employees:manage')
 * Must run AFTER authMiddleware (relies on req.user.permissions).
 *
 * Fine-grained permission checks let a Company Admin grant a Manager
 * extra capabilities (e.g. 'employees:manage') without promoting them
 * to a different role — the spec calls this out explicitly:
 * "Managers must not access company-wide administrative functions
 * unless explicitly granted permission."
 */
function permissionMiddleware(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    // super_admin bypasses fine-grained permission checks entirely.
    if (req.user.roles.includes('super_admin')) {
      return next();
    }
    const hasAll = requiredPermissions.every((perm) => req.user.permissions.includes(perm));
    if (!hasAll) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = permissionMiddleware;
