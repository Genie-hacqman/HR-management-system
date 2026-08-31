const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT ja.*, jp.title AS job_title, jp.slug AS job_slug
  FROM job_applications ja
  JOIN job_postings jp ON jp.id = ja.job_posting_id
`;

async function submit(companyId, jobPostingId, {
  firstName, lastName, email, phone, resumeUrl, coverLetter,
}) {
  const [result] = await pool.query(
    `INSERT INTO job_applications
      (company_id, job_posting_id, applicant_first_name, applicant_last_name, applicant_email, applicant_phone, resume_url, cover_letter)
     VALUES (:companyId, :jobPostingId, :firstName, :lastName, :email, :phone, :resumeUrl, :coverLetter)`,
    { companyId, jobPostingId, firstName, lastName, email, phone, resumeUrl, coverLetter }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE ja.id = :id AND ja.company_id = :companyId LIMIT 1`, { id, companyId });
  return rows[0] || null;
}

async function listByCompany(companyId, { jobPostingId = null, status = null, page = 1, pageSize = 20 } = {}) {
  const params = { companyId };
  let where = `WHERE ja.company_id = :companyId`;
  if (jobPostingId) {
    where += ` AND ja.job_posting_id = :jobPostingId`;
    params.jobPostingId = jobPostingId;
  }
  if (status) {
    where += ` AND ja.status = :status`;
    params.status = status;
  }
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM job_applications ja ${where}`, params);
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY ja.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );
  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

async function setStatus(id, companyId, status) {
  await pool.query(
    `UPDATE job_applications SET status = :status WHERE id = :id AND company_id = :companyId`,
    { id, companyId, status }
  );
  return findByIdAndCompany(id, companyId);
}

async function updateNotes(id, companyId, internalNotes) {
  await pool.query(
    `UPDATE job_applications SET internal_notes = :internalNotes WHERE id = :id AND company_id = :companyId`,
    { id, companyId, internalNotes }
  );
  return findByIdAndCompany(id, companyId);
}

module.exports = { submit, findByIdAndCompany, listByCompany, setStatus, updateNotes };
