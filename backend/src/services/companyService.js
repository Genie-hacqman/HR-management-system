const slugify = require('slugify');
const companyModel = require('../models/companyModel');
const { ApiError } = require('../utils/apiResponse');

async function generateUniqueSlug(name) {
  const base = slugify(name, { lower: true, strict: true });
  let candidate = base;
  let counter = 1;
  // Guard against collisions across tenants (company names need not be
  // globally unique, but slugs are used in-app so must be).
  while (await companyModel.findBySlug(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function registerCompany(payload) {
  const existing = await companyModel.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, 'A company with this email is already registered');
  }
  const slug = await generateUniqueSlug(payload.name);
  return companyModel.create({ ...payload, slug });
}

async function updateCompanySettings(companyId, fields) {
  const company = await companyModel.findById(companyId);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }
  return companyModel.updateSettings(companyId, fields);
}

module.exports = { registerCompany, updateCompanySettings, generateUniqueSlug };
