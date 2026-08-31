const { pool } = require('../config/db');

async function create({ companyId, userId, type, title, message = null, link = null }) {
  await pool.query(
    `INSERT INTO notifications (company_id, user_id, type, title, message, link)
     VALUES (:companyId, :userId, :type, :title, :message, :link)`,
    { companyId, userId, type, title, message, link }
  );
}

async function createMany(companyId, userIds, { type, title, message = null, link = null }) {
  for (const userId of userIds) {
    // eslint-disable-next-line no-await-in-loop
    await create({ companyId, userId, type, title, message, link });
  }
}

async function listForUser(userId, { unreadOnly = false, page = 1, pageSize = 20 } = {}) {
  const params = { userId };
  let where = `WHERE user_id = :userId`;
  if (unreadOnly) where += ` AND is_read = FALSE`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM notifications ${where}`, params);
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function countUnread(userId) {
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id = :userId AND is_read = FALSE`,
    { userId }
  );
  return total;
}

async function markRead(id, userId) {
  await pool.query(`UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :userId`, { id, userId });
}

async function markAllRead(userId) {
  await pool.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = :userId AND is_read = FALSE`, { userId });
}

module.exports = { create, createMany, listForUser, countUnread, markRead, markAllRead };
