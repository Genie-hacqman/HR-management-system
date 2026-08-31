const express = require('express');
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createDepartmentValidator, updateDepartmentValidator } = require('../validators/departmentValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

// Everyone in the company can view departments (needed for employee forms, dashboards, etc).
router.get('/', roleMiddleware('company_admin', 'manager', 'employee'), departmentController.listDepartments);
router.get('/:id', roleMiddleware('company_admin', 'manager', 'employee'), departmentController.getDepartment);

// Only Company Admin (or a Manager explicitly granted departments:manage) can mutate.
const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('departments:manage')];

router.post('/', canManage, createDepartmentValidator, validate, departmentController.createDepartment);
router.put('/:id', canManage, updateDepartmentValidator, validate, departmentController.updateDepartment);
router.delete('/:id', canManage, departmentController.deleteDepartment);

module.exports = router;
