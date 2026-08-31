const { body } = require('express-validator');

const registerCompanyValidator = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('companyEmail').optional({ checkFalsy: true }).isEmail().withMessage('Company email must be valid'),
  body('companyCountry').optional({ checkFalsy: true }).isString(),
  body('companyCurrency').optional({ checkFalsy: true }).isString().isLength({ min: 3, max: 3 }),
  body('companyTimezone').optional({ checkFalsy: true }).isString(),

  body('adminFirstName').trim().notEmpty().withMessage('First name is required'),
  body('adminLastName').trim().notEmpty().withMessage('Last name is required'),
  body('adminEmail').trim().isEmail().withMessage('A valid admin email is required').normalizeEmail(),
  body('adminPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = {
  registerCompanyValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
};
