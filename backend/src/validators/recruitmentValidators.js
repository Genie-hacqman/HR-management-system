const { body, param } = require('express-validator');

const createJobPostingValidator = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('requirements').optional({ checkFalsy: true }).isString(),
  body('location').optional({ checkFalsy: true }).isString(),
  body('employmentType').optional({ checkFalsy: true }).isIn(['full_time', 'part_time', 'contract', 'intern']),
  body('departmentId').optional({ checkFalsy: true }).isInt(),
  body('positionId').optional({ checkFalsy: true }).isInt(),
];

const updateJobPostingValidator = [
  param('id').isInt().withMessage('Invalid job posting id'),
  body('title').optional({ checkFalsy: true }).trim().notEmpty(),
  body('employment_type').optional({ checkFalsy: true }).isIn(['full_time', 'part_time', 'contract', 'intern']),
  body('department_id').optional({ checkFalsy: true }).isInt(),
  body('position_id').optional({ checkFalsy: true }).isInt(),
];

const submitApplicationValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('resumeUrl').optional({ checkFalsy: true }).isURL().withMessage('resumeUrl must be a valid URL'),
  body('coverLetter').optional({ checkFalsy: true }).isString().isLength({ max: 5000 }),
];

const setApplicationStatusValidator = [
  param('id').isInt().withMessage('Invalid application id'),
  body('status').isIn(['applied', 'screening', 'interview', 'shortlisted', 'hired', 'rejected']),
];

const scheduleInterviewValidator = [
  param('id').isInt().withMessage('Invalid application id'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date/time'),
  body('method').optional({ checkFalsy: true }).isString(),
  body('interviewerId').optional({ checkFalsy: true }).isInt(),
  body('notes').optional({ checkFalsy: true }).isString(),
];

const updateInterviewValidator = [
  param('id').isInt().withMessage('Invalid interview id'),
  body('scheduled_at').optional({ checkFalsy: true }).isISO8601(),
  body('status').optional({ checkFalsy: true }).isIn(['scheduled', 'completed', 'cancelled']),
  body('notes').optional({ checkFalsy: true }).isString(),
];

module.exports = {
  createJobPostingValidator,
  updateJobPostingValidator,
  submitApplicationValidator,
  setApplicationStatusValidator,
  scheduleInterviewValidator,
  updateInterviewValidator,
};
