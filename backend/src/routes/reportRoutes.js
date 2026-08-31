const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { dateRangeReportValidator } = require('../validators/reportValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

const canView = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('reports:view')];

router.get('/employees', canView, dateRangeReportValidator, validate, reportController.employeeReport);
router.get('/attendance', canView, dateRangeReportValidator, validate, reportController.attendanceReport);
router.get('/leave', canView, dateRangeReportValidator, validate, reportController.leaveReport);
router.get('/payroll', canView, reportController.payrollReport);
router.get('/recruitment', canView, reportController.recruitmentReport);
router.get('/performance', canView, reportController.performanceReport);

module.exports = router;
