const { body, param } = require('express-validator');

const createPositionValidator = [
  body('title').trim().notEmpty().withMessage('Position title is required'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('departmentId').optional({ checkFalsy: true }).isInt().withMessage('departmentId must be a department id'),
];

const updatePositionValidator = [
  param('id').isInt().withMessage('Invalid position id'),
  body('title').optional({ checkFalsy: true }).trim().notEmpty(),
  body('description').optional({ checkFalsy: true }).isString(),
  body('department_id').optional({ checkFalsy: true }).isInt(),
];

module.exports = { createPositionValidator, updatePositionValidator };
