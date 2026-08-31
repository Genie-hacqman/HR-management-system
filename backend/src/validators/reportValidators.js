const { query } = require('express-validator');

const dateRangeReportValidator = [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('departmentId').optional().isInt(),
  query('status').optional().isString(),
  query('format').optional().isIn(['json', 'csv']),
];

module.exports = { dateRangeReportValidator };
