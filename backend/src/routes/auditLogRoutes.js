const express = require('express');
const auditLogModel = require('../models/auditLogModel');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const { ok } = require('../utils/apiResponse');

const router = express.Router();

router.use(authMiddleware, companyMiddleware, roleMiddleware('company_admin'));

router.get('/', async (req, res, next) => {
  try {
    const { userId, action, resource, resourceId, limit, offset } = req.query;
    const logs = await auditLogModel.list({ companyId: req.companyId, userId, action, resource, resourceId, limit, offset });
    return ok(res, { logs });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
