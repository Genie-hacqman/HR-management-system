const { ApiError } = require('../utils/apiResponse');

/**
 * Multi-tenant isolation guard.
 *
 * Attaches `req.companyId`, derived ONLY from the authenticated user's
 * JWT-backed session (req.user.companyId) — never from the request
 * body, query string, or URL params. All company-scoped model/service
 * calls downstream must use `req.companyId`, not any client-supplied
 * value.
 *
 * super_admin requests are platform-wide by default and do not carry a
 * companyId; routes that are company-scoped for super_admin too (e.g.
 * "view a specific company's employees") should read an explicit
 * `:companyId` route param separately and validate it against the
 * companies table — that is NOT what this middleware does, precisely
 * to keep the "trust the token, not the client" rule unambiguous.
 */
function companyMiddleware(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.roles.includes('super_admin')) {
    // Super admins aren't bound to a single company by default.
    req.companyId = null;
    return next();
  }

  if (!req.user.companyId) {
    return next(new ApiError(403, 'This account is not associated with a company'));
  }

  // Defensive: if the client tried to smuggle a different company_id in
  // the body, strip/override it so every downstream handler is safe.
  if (req.body && typeof req.body === 'object' && 'company_id' in req.body) {
    delete req.body.company_id;
  }
  if (req.body && typeof req.body === 'object' && 'companyId' in req.body) {
    delete req.body.companyId;
  }

  req.companyId = req.user.companyId;
  return next();
}

module.exports = companyMiddleware;
