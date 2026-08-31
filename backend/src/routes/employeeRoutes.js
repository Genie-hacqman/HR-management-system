const express = require('express');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
  setEmployeeStatusValidator,
  listEmployeesValidator,
} = require('../validators/employeeValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

// Company Admin manages employees by default; a Manager only if
// explicitly granted 'employees:manage' (spec Section 1).
const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('employees:manage')];

// --- Self-service (any authenticated employee) ---------------------------
router.get('/me', employeeController.getMyProfile);
router.put('/me', employeeController.updateMyProfile);

// --- Manager's own team --------------------------------------------------
router.get('/me/team', roleMiddleware('manager', 'company_admin'), employeeController.getMyTeam);

// --- Dashboard support data -----------------------------------------------
router.get(
  '/stats/department-distribution',
  roleMiddleware('company_admin', 'manager'),
  employeeController.getDepartmentDistribution
);

// --- Admin / manager employee management ----------------------------------
router.get('/', canManage, listEmployeesValidator, validate, employeeController.listEmployees);
router.post('/', canManage, createEmployeeValidator, validate, employeeController.createEmployee);
router.get('/:id', canManage, employeeController.getEmployee);
router.put('/:id', canManage, updateEmployeeValidator, validate, employeeController.updateEmployee);
router.patch('/:id/status', canManage, setEmployeeStatusValidator, validate, employeeController.setStatus);
router.delete('/:id', canManage, employeeController.deactivateEmployee);
router.get('/:id/history', canManage, employeeController.getEmployeeHistory);

module.exports = router;
