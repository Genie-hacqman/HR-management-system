const express = require('express');
const platformController = require('../controllers/platformController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('super_admin'));

router.get('/stats', platformController.getStats);
router.get('/audit-logs', platformController.getAuditLogs);

module.exports = router;
