const fs = require('fs');
const path = require('path');
const documentModel = require('../models/documentModel');
const employeeModel = require('../models/employeeModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');
const { UPLOAD_DIR } = require('../middleware/uploadMiddleware');

async function uploadDocument(companyId, uploaderUserId, { employeeId, documentType, title }, file) {
  const employee = await employeeModel.findByIdAndCompany(employeeId, companyId);
  if (!employee) {
    fs.unlink(file.path, () => {});
    throw new ApiError(422, 'employeeId does not refer to an employee in this company');
  }

  const document = await documentModel.create(companyId, {
    employeeId,
    documentType,
    title,
    originalFilename: file.originalname,
    storedFilename: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedBy: uploaderUserId,
  });

  await notificationService.notifyEmployee(companyId, employee, {
    type: 'document_uploaded',
    title: 'A new document was added to your profile',
    message: document.title,
    link: '/dashboard/my-documents',
  });

  return document;
}

async function listDocuments(companyId, filters) {
  return documentModel.listByCompany(companyId, filters);
}

async function requireEmployeeForUser(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account');
  }
  return employee;
}

async function getMyDocuments(companyId, userId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return documentModel.listForEmployee(companyId, employee.id);
}

/**
 * Resolves a document for download, re-checking authorization on every
 * call rather than trusting anything cached client-side: either the
 * requester has documents:manage-class staff access, or the document
 * belongs to their own linked employee record. Returns the absolute
 * on-disk path — the caller (controller) is responsible for streaming
 * it, never redirecting to a public URL.
 */
async function resolveDownload(companyId, requestingUser, documentId) {
  const document = await documentModel.findByIdAndCompany(documentId, companyId);
  if (!document) throw new ApiError(404, 'Document not found');

  const hasBroadAccess = requestingUser.roles.includes('super_admin')
    || requestingUser.roles.includes('company_admin')
    || requestingUser.permissions.includes('documents:manage');

  if (!hasBroadAccess) {
    const ownEmployee = await employeeModel.findByUserId(requestingUser.id);
    if (!ownEmployee || ownEmployee.id !== document.employee_id) {
      throw new ApiError(403, 'You do not have permission to access this document');
    }
  }

  const absolutePath = path.join(UPLOAD_DIR, document.stored_filename);
  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'This document is no longer available');
  }
  return { document, absolutePath };
}

async function deleteDocument(companyId, id) {
  const document = await documentModel.findByIdAndCompany(id, companyId);
  if (!document) throw new ApiError(404, 'Document not found');
  await documentModel.softDelete(id, companyId);
}

module.exports = { uploadDocument, listDocuments, getMyDocuments, resolveDownload, deleteDocument };
