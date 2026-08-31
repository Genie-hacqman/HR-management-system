const express = require('express');
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { updateCompanyValidator } = require('../validators/companyValidators');

const router = express.Router();

router.use(authMiddleware);

// Company Admin manages their own company.
router.get('/me', companyMiddleware, companyController.getMyCompany);
router.put(
  '/me',
  companyMiddleware,
  roleMiddleware('company_admin'),
  permissionMiddleware('company:settings:manage'),
  updateCompanyValidator,
  validate,
  companyController.updateMyCompany
);

// Super Admin manages any company on the platform.
router.get('/', roleMiddleware('super_admin'), companyController.listCompanies);
router.get('/:id', roleMiddleware('super_admin'), companyController.getCompanyById);
router.patch('/:id/status', roleMiddleware('super_admin'), companyController.setCompanyStatus);

module.exports = router;
