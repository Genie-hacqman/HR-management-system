const { pool } = require('../config/db');
const auditLogModel = require('../models/auditLogModel');
const { ok } = require('../utils/apiResponse');

/** GET /api/platform/stats — Super Admin system-wide statistics. */
async function getStats(req, res, next) {
  try {
    const [[companyCounts]] = await pool.query(`
      SELECT
        COUNT(*) AS total_companies,
        SUM(status = 'active') AS active_companies,
        SUM(status = 'trial') AS trial_companies,
        SUM(status = 'suspended') AS suspended_companies
      FROM companies WHERE deleted_at IS NULL
    `);
    const [[userCounts]] = await pool.query(`
      SELECT COUNT(*) AS total_users, SUM(status = 'active') AS active_users
      FROM users WHERE deleted_at IS NULL
    `);
    return ok(res, { companies: companyCounts, users: userCounts });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/platform/audit-logs — Super Admin views platform-wide audit logs. */
async function getAuditLogs(req, res, next) {
  try {
    const { companyId, userId, action, limit, offset } = req.query;
    const logs = await auditLogModel.list({ companyId, userId, action, limit, offset });
    return ok(res, { logs });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStats, getAuditLogs };
