const { body, param } = require('express-validator');

const inviteUserValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('roles')
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned')
    .custom((roles) => roles.every((r) => typeof r === 'string'))
    .withMessage('Roles must be strings'),
];

const setRolesValidator = [
  param('id').isInt().withMessage('Invalid user id'),
  body('roles')
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned'),
];

const permissionSlugValidator = [
  param('id').isInt().withMessage('Invalid user id'),
  body('permission').trim().notEmpty().withMessage('Permission slug is required'),
];

const setStatusValidator = [
  param('id').isInt().withMessage('Invalid user id'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
];

module.exports = {
  inviteUserValidator,
  setRolesValidator,
  permissionSlugValidator,
  setStatusValidator,
};
