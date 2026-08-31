const { body } = require('express-validator');

const updateCompanyValidator = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('address').optional({ checkFalsy: true }).isString(),
  body('country').optional({ checkFalsy: true }).isString(),
  body('currency').optional({ checkFalsy: true }).isString().isLength({ min: 3, max: 3 }),
  body('timezone').optional({ checkFalsy: true }).isString(),
  body('industry').optional({ checkFalsy: true }).isString(),
  body('registration_number').optional({ checkFalsy: true }).isString(),
  body('working_hours_start').optional({ checkFalsy: true }).isString(),
  body('working_hours_end').optional({ checkFalsy: true }).isString(),
];

module.exports = { updateCompanyValidator };
