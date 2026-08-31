const crypto = require('crypto');
const { pool } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { hashPassword, comparePassword } = require('../utils/password');
const userModel = require('../models/userModel');
const companyService = require('./companyService');
const tokenService = require('./tokenService');
const mailer = require('./mailerService');

/**
 * Registers a brand-new company AND its first Company Admin user in a
 * single DB transaction: either both are created, or neither is.
 */
async function registerCompanyWithAdmin({
  companyName, companyEmail, companyPhone, companyCountry, companyCurrency,
  companyTimezone, adminFirstName, adminLastName, adminEmail, adminPassword,
}) {
  const existingUser = await userModel.findByEmail(adminEmail);
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const slug = await companyService.generateUniqueSlug(companyName);
  const passwordHash = await hashPassword(adminPassword);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [companyResult] = await conn.query(
      `INSERT INTO companies (name, slug, email, phone, country, currency, timezone, status)
       VALUES (:name, :slug, :email, :phone, :country, :currency, :timezone, 'trial')`,
      {
        name: companyName,
        slug,
        email: companyEmail || adminEmail,
        phone: companyPhone || null,
        country: companyCountry || null,
        currency: companyCurrency || 'USD',
        timezone: companyTimezone || 'UTC',
      }
    );
    const companyId = companyResult.insertId;

    const [userResult] = await conn.query(
      `INSERT INTO users
        (company_id, first_name, last_name, email, password_hash, status, email_verification_token)
       VALUES (:companyId, :firstName, :lastName, :email, :passwordHash, 'active', :verificationToken)`,
      {
        companyId,
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        passwordHash,
        verificationToken,
      }
    );
    const userId = userResult.insertId;

    const [roleRows] = await conn.query(
      `SELECT id FROM roles WHERE slug = 'company_admin' LIMIT 1`
    );
    if (roleRows.length === 0) {
      throw new ApiError(500, 'company_admin role is not seeded — run the database seed script');
    }
    await conn.query(
      `INSERT INTO user_roles (user_id, role_id, company_id) VALUES (:userId, :roleId, :companyId)`,
      { userId, roleId: roleRows[0].id, companyId }
    );

    // Seed the default leave types for every new company (spec Section 8).
    // Company Admins can edit/archive/add to these afterward.
    const DEFAULT_LEAVE_TYPES = [
      { name: 'Annual Leave', days: 21, paid: true, requiresDoc: false },
      { name: 'Sick Leave', days: 10, paid: true, requiresDoc: true },
      { name: 'Emergency Leave', days: 5, paid: true, requiresDoc: false },
      { name: 'Maternity Leave', days: 90, paid: true, requiresDoc: true },
      { name: 'Paternity Leave', days: 10, paid: true, requiresDoc: true },
      { name: 'Unpaid Leave', days: 0, paid: false, requiresDoc: false },
      { name: 'Other', days: 0, paid: false, requiresDoc: false },
    ];
    for (const lt of DEFAULT_LEAVE_TYPES) {
      await conn.query(
        `INSERT INTO leave_types (company_id, name, default_days_per_year, is_paid, requires_document)
         VALUES (:companyId, :name, :days, :paid, :requiresDoc)`,
        { companyId, name: lt.name, days: lt.days, paid: lt.paid, requiresDoc: lt.requiresDoc }
      );
    }

    await conn.commit();

    const user = await userModel.findById(userId);
    await mailer.sendVerificationEmail(user.email, verificationToken);
    return { company: await companyService.updateCompanySettings(companyId, {}), user };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status !== 'active') {
    throw new ApiError(403, 'This account is not active. Contact your administrator.');
  }
  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = await tokenService.issueTokenPair(user);
  await userModel.touchLastLogin(user.id);

  return {
    user: sanitizeUser(user, tokens.roles),
    ...tokens,
  };
}

async function verifyEmail(token) {
  const user = await userModel.verifyEmailByToken(token);
  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  return user;
}

async function requestPasswordReset(email) {
  const user = await userModel.findByEmail(email);
  // Always respond the same way whether or not the email exists, to
  // avoid leaking which emails are registered.
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await userModel.setPasswordResetToken(user.id, token, expiresAt);
  await mailer.sendPasswordResetEmail(user.email, token);
}

async function resetPassword(token, newPassword) {
  const user = await userModel.findByValidResetToken(token);
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }
  const passwordHash = await hashPassword(newPassword);
  await userModel.updatePassword(user.id, passwordHash);
  await userModel.revokeAllRefreshTokensForUser(user.id);
}

function sanitizeUser(user, roles = []) {
  const { password_hash, email_verification_token, password_reset_token, ...safe } = user;
  return { ...safe, roles };
}

module.exports = {
  registerCompanyWithAdmin,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  sanitizeUser,
};
