const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT a.*, u.first_name AS author_first_name, u.last_name AS author_last_name
  FROM announcements a
  LEFT JOIN users u ON u.id = a.author_id
`;

async function create(companyId, { title, description, authorId, attachmentUrl = null }) {
  const [result] = await pool.query(
    `INSERT INTO announcements (company_id, title, description, author_id, attachment_url)
     VALUES (:companyId, :title, :description, :authorId, :attachmentUrl)`,
    { companyId, title, description, authorId, attachmentUrl }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE a.id = :id AND a.company_id = :companyId AND a.deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function listByCompany(companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE a.company_id = :companyId AND a.deleted_at IS NULL ORDER BY a.published_at DESC`,
    { companyId }
  );
  return rows;
}

async function update(id, companyId, fields) {
  const allowed = ['title', 'description', 'attachment_url'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE announcements SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(`UPDATE announcements SET deleted_at = NOW() WHERE id = :id AND company_id = :companyId`, { id, companyId });
}

module.exports = { create, findByIdAndCompany, listByCompany, update, softDelete };
