const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadDocumentValidator, documentIdParamValidator } = require('../validators/documentValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('documents:manage')];

router.get('/me', documentController.getMyDocuments);
router.get('/:id/download', documentIdParamValidator, validate, documentController.downloadDocument);

router.post(
  '/',
  canManage,
  upload.single('file'),
  uploadDocumentValidator,
  validate,
  documentController.uploadDocument
);
router.get('/', canManage, documentController.listDocuments);
router.delete('/:id', canManage, documentIdParamValidator, validate, documentController.deleteDocument);

module.exports = router;
