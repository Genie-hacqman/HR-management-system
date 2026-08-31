const { body, param, query } = require('express-validator');

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];

const createEmployeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('dateOfBirth').optional({ checkFalsy: true }).isISO8601().withMessage('dateOfBirth must be a valid date'),
  body('gender').optional({ checkFalsy: true }).isIn(GENDERS),
  body('address').optional({ checkFalsy: true }).isString(),
  body('emergencyContactName').optional({ checkFalsy: true }).isString(),
  body('emergencyContactPhone').optional({ checkFalsy: true }).isString(),
  body('departmentId').optional({ checkFalsy: true }).isInt(),
  body('positionId').optional({ checkFalsy: true }).isInt(),
  body('managerId').optional({ checkFalsy: true }).isInt(),
  body('employmentType').optional({ checkFalsy: true }).isIn(EMPLOYMENT_TYPES),
  body('employmentDate').optional({ checkFalsy: true }).isISO8601().withMessage('employmentDate must be a valid date'),
  body('salary').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('employmentStatus').optional({ checkFalsy: true }).isIn(EMPLOYMENT_STATUSES),
];

const updateEmployeeValidator = [
  param('id').isInt().withMessage('Invalid employee id'),
  body('first_name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('last_name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('gender').optional({ checkFalsy: true }).isIn(GENDERS),
  body('employment_type').optional({ checkFalsy: true }).isIn(EMPLOYMENT_TYPES),
  body('employment_status').optional({ checkFalsy: true }).isIn(EMPLOYMENT_STATUSES),
  body('salary').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('department_id').optional({ checkFalsy: true }).isInt(),
  body('position_id').optional({ checkFalsy: true }).isInt(),
  body('manager_id').optional({ checkFalsy: true }).isInt(),
];

const setEmployeeStatusValidator = [
  param('id').isInt().withMessage('Invalid employee id'),
  body('status').isIn(EMPLOYMENT_STATUSES).withMessage(`status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}`),
];

const listEmployeesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortDir').optional().isIn(['asc', 'desc']),
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator,
  setEmployeeStatusValidator,
  listEmployeesValidator,
};
