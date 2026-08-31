const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT d.*, e.first_name, e.last_name, e.employee_code
  FROM documents d
  JOIN employees e ON e.id = d.employee_id
`;

async function create(companyId, {
  employeeId, documentType, title, originalFilename, storedFilename, mimeType, sizeBytes, uploadedBy,
}) {
  const [result] = await pool.query(
    `INSERT INTO documents
      (company_id, employee_id, document_type, title, original_filename, stored_filename, mime_type, size_bytes, uploaded_by)
     VALUES (:companyId, :employeeId, :documentType, :title, :originalFilename, :storedFilename, :mimeType, :sizeBytes, :uploadedBy)`,
    { companyId, employeeId, documentType, title, originalFilename, storedFilename, mimeType, sizeBytes, uploadedBy }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE d.id = :id AND d.company_id = :companyId AND d.deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function listByCompany(companyId, { employeeId = null, documentType = null } = {}) {
  const params = { companyId };
  let where = `WHERE d.company_id = :companyId AND d.deleted_at IS NULL`;
  if (employeeId) {
    where += ` AND d.employee_id = :employeeId`;
    params.employeeId = employeeId;
  }
  if (documentType) {
    where += ` AND d.document_type = :documentType`;
    params.documentType = documentType;
  }
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY d.created_at DESC`, params);
  return rows;
}

async function listForEmployee(companyId, employeeId) {
  return listByCompany(companyId, { employeeId });
}

async function softDelete(id, companyId) {
  await pool.query(`UPDATE documents SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`, { id, companyId });
}

module.exports = { create, findByIdAndCompany, listByCompany, listForEmployee, softDelete };
