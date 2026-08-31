const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/admin', roleMiddleware('company_admin'), dashboardController.getAdminDashboard);
router.get('/manager', roleMiddleware('manager', 'company_admin'), dashboardController.getManagerDashboard);
router.get('/employee', dashboardController.getEmployeeDashboard);

module.exports = router;
