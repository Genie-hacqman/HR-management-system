const express = require('express');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createLeaveTypeValidator,
  updateLeaveTypeValidator,
  submitRequestValidator,
  rejectRequestValidator,
  calendarValidator,
} = require('../validators/leaveValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('leave:manage')];

router.get('/types', leaveController.listLeaveTypes);
router.post('/types', canManage, createLeaveTypeValidator, validate, leaveController.createLeaveType);
router.put('/types/:id', canManage, updateLeaveTypeValidator, validate, leaveController.updateLeaveType);
router.delete('/types/:id', canManage, leaveController.archiveLeaveType);

router.get('/balances/me', leaveController.getMyBalances);
router.post('/requests', submitRequestValidator, validate, leaveController.submitRequest);
router.get('/requests/me', leaveController.getMyRequests);
router.patch('/requests/:id/cancel', leaveController.cancelMyRequest);

router.get('/requests/team', roleMiddleware('manager', 'company_admin'), leaveController.listTeamRequests);

router.get('/requests', canManage, leaveController.listCompanyRequests);
router.get('/calendar', canManage, calendarValidator, validate, leaveController.getCalendar);
router.patch('/requests/:id/approve', canManage, leaveController.approveRequest);
router.patch('/requests/:id/reject', canManage, rejectRequestValidator, validate, leaveController.rejectRequest);

module.exports = router;
