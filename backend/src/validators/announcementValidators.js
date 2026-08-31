const { body, param } = require('express-validator');

const createAnnouncementValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('attachmentUrl').optional({ checkFalsy: true }).isURL().withMessage('attachmentUrl must be a valid URL'),
];

const updateAnnouncementValidator = [
  param('id').isInt().withMessage('Invalid announcement id'),
  body('title').optional({ checkFalsy: true }).trim().notEmpty(),
  body('description').optional({ checkFalsy: true }).trim().notEmpty(),
  body('attachment_url').optional({ checkFalsy: true }).isURL(),
];

module.exports = { createAnnouncementValidator, updateAnnouncementValidator };
