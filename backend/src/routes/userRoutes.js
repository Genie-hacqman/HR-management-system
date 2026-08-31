const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  inviteUserValidator,
  setRolesValidator,
  permissionSlugValidator,
  setStatusValidator,
} = require('../validators/userValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

// Managing users is a Company Admin action by default, OR any user who
// has been explicitly granted the 'employees:manage' permission (e.g. a
// Manager promoted with extra capability, per spec Section 1).
const canManageUsers = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('employees:manage')];

router.get('/', canManageUsers, userController.listUsers);
router.get('/:id', canManageUsers, userController.getUser);
router.post('/invite', canManageUsers, inviteUserValidator, validate, userController.inviteUser);
router.put('/:id/roles', roleMiddleware('company_admin'), setRolesValidator, validate, userController.setRoles);
router.post(
  '/:id/permissions',
  roleMiddleware('company_admin'),
  permissionSlugValidator,
  validate,
  userController.grantPermission
);
router.delete(
  '/:id/permissions',
  roleMiddleware('company_admin'),
  permissionSlugValidator,
  validate,
  userController.revokePermission
);
router.patch('/:id/status', canManageUsers, setStatusValidator, validate, userController.setStatus);

module.exports = router;
