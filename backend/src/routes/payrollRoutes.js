const express = require('express');
const payrollController = require('../controllers/payrollController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createPeriodValidator,
  updateItemValidator,
  listPeriodsValidator,
} = require('../validators/payrollValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/payslips/me', payrollController.getMyPayslips);
router.get('/payslips/me/:id', payrollController.getMyPayslip);
router.get('/salary-history/me', payrollController.getMySalaryHistory);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('payroll:manage')];

router.post('/periods', canManage, createPeriodValidator, validate, payrollController.createPeriod);
router.get('/periods', canManage, listPeriodsValidator, validate, payrollController.listPeriods);
router.get('/periods/:id', canManage, payrollController.getPeriod);
router.post('/periods/:id/calculate', canManage, payrollController.calculatePeriod);
router.put('/periods/:payrollId/items/:itemId', canManage, updateItemValidator, validate, payrollController.updateItem);
router.post('/periods/:id/review', canManage, payrollController.markReviewed);
router.post('/periods/:id/approve', canManage, payrollController.approvePeriod);
router.post('/periods/:id/process', canManage, payrollController.processPeriod);

module.exports = router;
