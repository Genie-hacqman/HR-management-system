const fs = require('fs');
const documentService = require('../services/documentService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created, ApiError } = require('../utils/apiResponse');

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(422, 'A file is required');
    }
    const document = await documentService.uploadDocument(req.companyId, req.user.id, req.body, req.file);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'document.uploaded',
      resource: 'documents', resourceId: document.id, ipAddress: req.ip,
      newValue: { title: document.title, document_type: document.document_type },
    });
    return created(res, { document }, 'Document uploaded');
  } catch (err) {
    return next(err);
  }
}

async function listDocuments(req, res, next) {
  try {
    const { employeeId, documentType } = req.query;
    const documents = await documentService.listDocuments(req.companyId, { employeeId, documentType });
    return ok(res, { documents });
  } catch (err) {
    return next(err);
  }
}

async function getMyDocuments(req, res, next) {
  try {
    const documents = await documentService.getMyDocuments(req.companyId, req.user.id);
    return ok(res, { documents });
  } catch (err) {
    return next(err);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { document, absolutePath } = await documentService.resolveDownload(req.companyId, req.user, req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.original_filename)}"`);
    if (document.mime_type) res.setHeader('Content-Type', document.mime_type);
    const stream = fs.createReadStream(absolutePath);
    stream.on('error', () => next(new ApiError(500, 'Unable to read this file')));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    await documentService.deleteDocument(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'document.deleted',
      resource: 'documents', resourceId: req.params.id, ipAddress: req.ip,
    });
    return ok(res, null, 'Document removed');
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadDocument, listDocuments, getMyDocuments, downloadDocument, deleteDocument };
