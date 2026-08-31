const { pool } = require('../config/db');

async function create(companyId, { title, slug, description, requirements, location, employmentType, departmentId, positionId, postedBy }) {
  const [result] = await pool.query(
    `INSERT INTO job_postings
      (company_id, title, slug, description, requirements, location, employment_type, department_id, position_id, posted_by)
     VALUES (:companyId, :title, :slug, :description, :requirements, :location, :employmentType, :departmentId, :positionId, :postedBy)`,
    { companyId, title, slug, description, requirements, location, employmentType, departmentId, positionId, postedBy }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM job_postings WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findBySlugAndCompany(slug, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM job_postings WHERE slug = :slug AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { slug, companyId }
  );
  return rows[0] || null;
}

async function listByCompany(companyId, { status = null, page = 1, pageSize = 20 } = {}) {
  const params = { companyId };
  let where = `WHERE company_id = :companyId AND deleted_at IS NULL`;
  if (status) {
    where += ` AND status = :status`;
    params.status = status;
  }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM job_postings ${where}`, params);
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `SELECT jp.*, (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_posting_id = jp.id) AS application_count
     FROM job_postings jp ${where} ORDER BY jp.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function update(id, companyId, fields) {
  const allowed = ['title', 'description', 'requirements', 'location', 'employment_type', 'department_id', 'position_id'];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(`UPDATE job_postings SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`, params);
  return findByIdAndCompany(id, companyId);
}

async function setStatus(id, companyId, status, extra = {}) {
  const fields = { status, ...extra };
  const setClauses = Object.keys(fields).map((k) => `${k} = :${k}`);
  await pool.query(
    `UPDATE job_postings SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    { ...fields, id, companyId }
  );
  return findByIdAndCompany(id, companyId);
}

// --- Public (unauthenticated) lookups ---------------------------------------

async function listPublishedForCompany(companyId) {
  const [rows] = await pool.query(
    `SELECT id, title, slug, location, employment_type, description, published_at
     FROM job_postings
     WHERE company_id = :companyId AND status = 'published' AND deleted_at IS NULL
     ORDER BY published_at DESC`,
    { companyId }
  );
  return rows;
}

async function findPublishedBySlug(companyId, slug) {
  const [rows] = await pool.query(
    `SELECT id, company_id, title, slug, location, employment_type, description, requirements, published_at
     FROM job_postings
     WHERE company_id = :companyId AND slug = :slug AND status = 'published' AND deleted_at IS NULL LIMIT 1`,
    { companyId, slug }
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findByIdAndCompany,
  findBySlugAndCompany,
  listByCompany,
  update,
  setStatus,
  listPublishedForCompany,
  findPublishedBySlug,
};
