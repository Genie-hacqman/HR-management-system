const { body, param } = require('express-validator');

const DOCUMENT_TYPES = ['employment_contract', 'identification', 'certificate', 'payslip', 'hr_letter', 'company_policy', 'other'];

const uploadDocumentValidator = [
  body('employeeId').isInt().withMessage('employeeId is required'),
  body('documentType').isIn(DOCUMENT_TYPES).withMessage(`documentType must be one of: ${DOCUMENT_TYPES.join(', ')}`),
  body('title').trim().notEmpty().withMessage('title is required'),
];

const documentIdParamValidator = [param('id').isInt().withMessage('Invalid document id')];

module.exports = { uploadDocumentValidator, documentIdParamValidator, DOCUMENT_TYPES };
