const { pool } = require('../config/db');

async function record({
  companyId = null, userId = null, action, resource, resourceId = null,
  ipAddress = null, previousValue = null, newValue = null,
}) {
  await pool.query(
    `INSERT INTO audit_logs
      (company_id, user_id, action, resource, resource_id, ip_address, previous_value, new_value)
     VALUES (:companyId, :userId, :action, :resource, :resourceId, :ipAddress, :previousValue, :newValue)`,
    {
      companyId,
      userId,
      action,
      resource,
      resourceId,
      ipAddress,
      previousValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    }
  );
}

/**
 * Lists audit log entries, optionally scoped to one company. Passing
 * companyId = null returns platform-wide logs — callers must only do
 * that for super_admin requests (enforced at the route layer).
 */
async function list({ companyId = null, userId = null, action = null, resource = null, resourceId = null, limit = 50, offset = 0 } = {}) {
  const params = { limit: Number(limit), offset: Number(offset) };
  let sql = `SELECT * FROM audit_logs WHERE 1=1`;
  if (companyId) {
    sql += ` AND company_id = :companyId`;
    params.companyId = companyId;
  }
  if (userId) {
    sql += ` AND user_id = :userId`;
    params.userId = userId;
  }
  if (action) {
    sql += ` AND action = :action`;
    params.action = action;
  }
  if (resource) {
    sql += ` AND resource = :resource`;
    params.resource = resource;
  }
  if (resourceId) {
    sql += ` AND resource_id = :resourceId`;
    params.resourceId = resourceId;
  }
  sql += ` ORDER BY created_at DESC LIMIT :limit OFFSET :offset`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { record, list };
