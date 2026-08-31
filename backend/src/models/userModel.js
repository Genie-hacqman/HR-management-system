const { pool } = require('../config/db');

async function create({ companyId, firstName, lastName, email, passwordHash, phone = null }) {
  const [result] = await pool.query(
    `INSERT INTO users (company_id, first_name, last_name, email, password_hash, phone, status)
     VALUES (:companyId, :firstName, :lastName, :email, :passwordHash, :phone, 'active')`,
    { companyId, firstName, lastName, email, passwordHash, phone }
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1`,
    { email }
  );
  return rows[0] || null;
}

async function setEmailVerificationToken(userId, token) {
  await pool.query(
    `UPDATE users SET email_verification_token = :token WHERE id = :userId`,
    { userId, token }
  );
}

async function verifyEmailByToken(token) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email_verification_token = :token LIMIT 1`,
    { token }
  );
  const user = rows[0];
  if (!user) return null;
  await pool.query(
    `UPDATE users SET email_verified_at = NOW(), email_verification_token = NULL WHERE id = :id`,
    { id: user.id }
  );
  return findById(user.id);
}

async function setPasswordResetToken(userId, token, expiresAt) {
  await pool.query(
    `UPDATE users SET password_reset_token = :token, password_reset_expires = :expiresAt WHERE id = :userId`,
    { userId, token, expiresAt }
  );
}

async function findByValidResetToken(token) {
  const [rows] = await pool.query(
    `SELECT * FROM users
     WHERE password_reset_token = :token
       AND password_reset_expires IS NOT NULL
       AND password_reset_expires > NOW()
     LIMIT 1`,
    { token }
  );
  return rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = :passwordHash, password_reset_token = NULL, password_reset_expires = NULL
     WHERE id = :userId`,
    { userId, passwordHash }
  );
}

async function touchLastLogin(userId) {
  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = :userId`, { userId });
}

async function saveRefreshToken(userId, tokenHash, expiresAt) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)`,
    { userId, tokenHash, expiresAt }
  );
}

async function findRefreshToken(tokenHash) {
  const [rows] = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1`,
    { tokenHash }
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash`,
    { tokenHash }
  );
}

async function revokeAllRefreshTokensForUser(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
    { userId }
  );
}

/**
 * Lists users within a single company (never across companies). Callers
 * MUST pass a companyId derived from req.companyId, never client input.
 */
async function listByCompany(companyId, { search = null, status = null } = {}) {
  const params = { companyId };
  let sql = `
    SELECT u.id, u.company_id, u.first_name, u.last_name, u.email, u.phone,
           u.status, u.email_verified_at, u.last_login_at, u.created_at
    FROM users u
    WHERE u.company_id = :companyId AND u.deleted_at IS NULL
  `;
  if (search) {
    sql += ` AND (u.first_name LIKE :search OR u.last_name LIKE :search OR u.email LIKE :search)`;
    params.search = `%${search}%`;
  }
  if (status) {
    sql += ` AND u.status = :status`;
    params.status = status;
  }
  sql += ` ORDER BY u.created_at DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Finds a user but only if they belong to the given company (isolation guard). */
async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function setStatus(userId, status) {
  await pool.query(`UPDATE users SET status = :status WHERE id = :userId`, { userId, status });
  return findById(userId);
}

async function softDelete(userId) {
  await pool.query(
    `UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = :userId`,
    { userId }
  );
}

module.exports = {
  create,
  findById,
  findByEmail,
  setEmailVerificationToken,
  verifyEmailByToken,
  setPasswordResetToken,
  findByValidResetToken,
  updatePassword,
  touchLastLogin,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  listByCompany,
  findByIdAndCompany,
  setStatus,
  softDelete,
};
