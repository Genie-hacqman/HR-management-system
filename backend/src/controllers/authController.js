const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const auditLogModel = require('../models/auditLogModel');
const userModel = require('../models/userModel');
const jwtUtil = require('../utils/jwt');
const { ok, created } = require('../utils/apiResponse');

async function registerCompany(req, res, next) {
  try {
    const { company, user } = await authService.registerCompanyWithAdmin(req.body);
    await auditLogModel.record({
      companyId: company.id,
      userId: user.id,
      action: 'company.registered',
      resource: 'companies',
      resourceId: company.id,
      ipAddress: req.ip,
      newValue: { name: company.name, slug: company.slug },
    });
    return created(res, {
      company,
      user: authService.sanitizeUser(user, ['company_admin']),
    }, 'Company registered successfully. Please check your email to verify your account.');
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    await auditLogModel.record({
      companyId: result.user.company_id,
      userId: result.user.id,
      action: 'user.login',
      resource: 'users',
      resourceId: result.user.id,
      ipAddress: req.ip,
    });
    return ok(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await tokenService.rotateRefreshToken(refreshToken);
    return ok(res, tokens, 'Token refreshed');
  } catch (err) {
    err.statusCode = err.statusCode || 401;
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await userModel.revokeRefreshToken(jwtUtil.hashToken(refreshToken));
    }
    return ok(res, null, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    const user = await authService.verifyEmail(token);
    return ok(res, { email: user.email }, 'Email verified successfully');
  } catch (err) {
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body.email);
    // Same response regardless of whether the email exists.
    return ok(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return ok(res, null, 'Password has been reset successfully. Please log in.');
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    return ok(res, { user: req.user }, 'Current user');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  registerCompany,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  me,
};
