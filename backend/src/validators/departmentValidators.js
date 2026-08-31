const { body, param } = require('express-validator');

const createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('managerId').optional({ checkFalsy: true }).isInt().withMessage('managerId must be an employee id'),
];

const updateDepartmentValidator = [
  param('id').isInt().withMessage('Invalid department id'),
  body('name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('description').optional({ checkFalsy: true }).isString(),
  body('manager_id').optional({ checkFalsy: true }).isInt(),
];

module.exports = { createDepartmentValidator, updateDepartmentValidator };
