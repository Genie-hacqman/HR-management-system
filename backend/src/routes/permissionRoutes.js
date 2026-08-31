const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('company_admin', 'super_admin'), userController.listPermissions);

module.exports = router;
