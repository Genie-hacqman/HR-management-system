const notificationService = require('../services/notificationService');
const { ok } = require('../utils/apiResponse');

async function listMyNotifications(req, res, next) {
  try {
    const { unreadOnly, page, pageSize } = req.query;
    const result = await notificationService.listMyNotifications(req.user.id, {
      unreadOnly: unreadOnly === 'true', page, pageSize,
    });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return ok(res, { count });
  } catch (err) {
    return next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.user.id, req.params.id);
    return ok(res, null, 'Marked as read');
  } catch (err) {
    return next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return ok(res, null, 'All notifications marked as read');
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
