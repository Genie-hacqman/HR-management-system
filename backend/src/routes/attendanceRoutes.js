const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  clockValidator,
  dateRangeValidator,
  summaryValidator,
  dateQueryValidator,
} = require('../validators/attendanceValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

// --- Self-service (any authenticated employee) ---------------------------
router.post('/clock-in', clockValidator, validate, attendanceController.clockIn);
router.post('/clock-out', clockValidator, validate, attendanceController.clockOut);
router.get('/me/today', attendanceController.getMyToday);
router.get('/me/history', dateRangeValidator, validate, attendanceController.getMyHistory);
router.get('/me/summary', summaryValidator, validate, attendanceController.getMySummary);

// --- Manager's own team ----------------------------------------------------
router.get(
  '/team',
  roleMiddleware('manager', 'company_admin'),
  dateQueryValidator,
  validate,
  attendanceController.getTeamAttendance
);

// --- Admin / HR company-wide reporting -------------------------------------
const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('attendance:manage')];

router.get('/', canManage, dateRangeValidator, validate, attendanceController.listCompanyAttendance);
router.get('/late', canManage, dateQueryValidator, validate, attendanceController.listLate);
router.get('/absent', canManage, dateQueryValidator, validate, attendanceController.listAbsent);
router.get('/stats/today', canManage, dateQueryValidator, validate, attendanceController.getDashboardStats);

module.exports = router;
