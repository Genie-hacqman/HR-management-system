const { pool } = require('../config/db');
const notificationModel = require('../models/notificationModel');

async function notifyEmployee(companyId, employee, payload) {
  if (!employee || !employee.user_id) return;
  await notificationModel.create({ companyId, userId: employee.user_id, ...payload });
}

async function notifyManagerOf(companyId, employee, payload) {
  if (!employee || !employee.manager_id) return;
  const [rows] = await pool.query(
    `SELECT user_id FROM employees WHERE id = :managerId AND company_id = :companyId LIMIT 1`,
    { managerId: employee.manager_id, companyId }
  );
  const managerUserId = rows[0]?.user_id;
  if (managerUserId) {
    await notificationModel.create({ companyId, userId: managerUserId, ...payload });
  }
}

async function notifyCompanyAdmins(companyId, payload) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE u.company_id = :companyId AND u.status = 'active' AND r.slug = 'company_admin'`,
    { companyId }
  );
  await notificationModel.createMany(companyId, rows.map((r) => r.id), payload);
}

async function notifyAllCompanyUsers(companyId, payload) {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE company_id = :companyId AND status = 'active'`,
    { companyId }
  );
  await notificationModel.createMany(companyId, rows.map((r) => r.id), payload);
}

async function listMyNotifications(userId, filters) {
  return notificationModel.listForUser(userId, filters);
}

async function getUnreadCount(userId) {
  return notificationModel.countUnread(userId);
}

async function markAsRead(userId, id) {
  await notificationModel.markRead(id, userId);
}

async function markAllAsRead(userId) {
  await notificationModel.markAllRead(userId);
}

module.exports = {
  notifyEmployee,
  notifyManagerOf,
  notifyCompanyAdmins,
  notifyAllCompanyUsers,
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
