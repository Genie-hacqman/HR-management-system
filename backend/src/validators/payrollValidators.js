const { body, param, query } = require('express-validator');

const createPeriodValidator = [
  body('periodStart').isISO8601().withMessage('periodStart must be a valid date'),
  body('periodEnd').isISO8601().withMessage('periodEnd must be a valid date'),
  body('payDate').isISO8601().withMessage('payDate must be a valid date'),
  body('notes').optional({ checkFalsy: true }).isString().isLength({ max: 1000 }),
];

const updateItemValidator = [
  param('payrollId').isInt(),
  param('itemId').isInt(),
  body('allowances').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('bonuses').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('deductions').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('tax').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('notes').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
];

const listPeriodsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createPeriodValidator, updateItemValidator, listPeriodsValidator };
