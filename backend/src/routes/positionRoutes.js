const express = require('express');
const positionController = require('../controllers/positionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createPositionValidator, updatePositionValidator } = require('../validators/positionValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/', roleMiddleware('company_admin', 'manager', 'employee'), positionController.listPositions);
router.get('/:id', roleMiddleware('company_admin', 'manager', 'employee'), positionController.getPosition);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('positions:manage')];

router.post('/', canManage, createPositionValidator, validate, positionController.createPosition);
router.put('/:id', canManage, updatePositionValidator, validate, positionController.updatePosition);
router.delete('/:id', canManage, positionController.deletePosition);

module.exports = router;
