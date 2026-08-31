const { body, param, query } = require('express-validator');

const createLeaveTypeValidator = [
  body('name').trim().notEmpty().withMessage('Leave type name is required'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('defaultDaysPerYear').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('isPaid').optional().isBoolean(),
  body('requiresDocument').optional().isBoolean(),
];

const updateLeaveTypeValidator = [
  param('id').isInt().withMessage('Invalid leave type id'),
  body('name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('default_days_per_year').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('is_paid').optional().isBoolean(),
  body('requires_document').optional().isBoolean(),
];

const submitRequestValidator = [
  body('leaveTypeId').isInt().withMessage('leaveTypeId is required'),
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid date'),
  body('reason').optional({ checkFalsy: true }).isString().isLength({ max: 1000 }),
  body('supportingDocumentUrl').optional({ checkFalsy: true }).isURL().withMessage('supportingDocumentUrl must be a valid URL'),
];

const rejectRequestValidator = [
  param('id').isInt().withMessage('Invalid leave request id'),
  body('reason').trim().notEmpty().withMessage('A rejection reason is required'),
];

const calendarValidator = [
  query('dateFrom').isISO8601().withMessage('dateFrom is required and must be a valid date'),
  query('dateTo').isISO8601().withMessage('dateTo is required and must be a valid date'),
];

module.exports = {
  createLeaveTypeValidator,
  updateLeaveTypeValidator,
  submitRequestValidator,
  rejectRequestValidator,
  calendarValidator,
};
