const { body, query } = require('express-validator');

const clockValidator = [
  body('lat').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }).withMessage('lat must be a valid latitude'),
  body('lng').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }).withMessage('lng must be a valid longitude'),
];

const dateRangeValidator = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date'),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 200 }),
];

const summaryValidator = [
  query('dateFrom').isISO8601().withMessage('dateFrom is required and must be a valid date'),
  query('dateTo').isISO8601().withMessage('dateTo is required and must be a valid date'),
];

const dateQueryValidator = [
  query('date').optional().isISO8601().withMessage('date must be valid'),
];

module.exports = { clockValidator, dateRangeValidator, summaryValidator, dateQueryValidator };
