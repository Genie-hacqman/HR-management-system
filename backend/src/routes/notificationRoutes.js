const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/', notificationController.listMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
