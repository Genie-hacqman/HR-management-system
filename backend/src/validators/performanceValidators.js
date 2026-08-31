const { body, param } = require('express-validator');

const createGoalValidator = [
  body('employeeId').isInt().withMessage('employeeId is required'),
  body('title').trim().notEmpty().withMessage('Goal title is required'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('kpi').optional({ checkFalsy: true }).isString(),
  body('targetValue').optional({ checkFalsy: true }).isString(),
  body('startDate').optional({ checkFalsy: true }).isISO8601(),
  body('dueDate').optional({ checkFalsy: true }).isISO8601(),
];

const updateGoalValidator = [
  param('id').isInt().withMessage('Invalid goal id'),
  body('title').optional({ checkFalsy: true }).trim().notEmpty(),
  body('kpi').optional({ checkFalsy: true }).isString(),
  body('target_value').optional({ checkFalsy: true }).isString(),
  body('due_date').optional({ checkFalsy: true }).isISO8601(),
];

const updateGoalProgressValidator = [
  param('id').isInt().withMessage('Invalid goal id'),
  body('progressPercent').optional({ checkFalsy: true }).isInt({ min: 0, max: 100 }),
  body('status').optional({ checkFalsy: true }).isIn(['not_started', 'in_progress', 'completed', 'missed']),
];

const createReviewValidator = [
  body('employeeId').isInt().withMessage('employeeId is required'),
  body('reviewPeriodStart').isISO8601().withMessage('reviewPeriodStart must be a valid date'),
  body('reviewPeriodEnd').isISO8601().withMessage('reviewPeriodEnd must be a valid date'),
];

const updateReviewValidator = [
  param('id').isInt().withMessage('Invalid review id'),
  body('strengths').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('areas_for_improvement').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('manager_feedback').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('overall_rating').optional({ checkFalsy: true }).isFloat({ min: 0, max: 5 }),
];

const acknowledgeReviewValidator = [
  param('id').isInt().withMessage('Invalid review id'),
  body('comments').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
];

module.exports = {
  createGoalValidator,
  updateGoalValidator,
  updateGoalProgressValidator,
  createReviewValidator,
  updateReviewValidator,
  acknowledgeReviewValidator,
};
