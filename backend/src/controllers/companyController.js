const companyModel = require('../models/companyModel');
const companyService = require('../services/companyService');
const auditLogModel = require('../models/auditLogModel');
const { ApiError, ok } = require('../utils/apiResponse');

/** GET /api/companies/me — the authenticated user's own company. */
async function getMyCompany(req, res, next) {
  try {
    if (!req.companyId) {
      throw new ApiError(400, 'This account is not associated with a single company');
    }
    const company = await companyModel.findById(req.companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    return ok(res, { company });
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/companies/me — Company Admin updates their own company settings. */
async function updateMyCompany(req, res, next) {
  try {
    const before = await companyModel.findById(req.companyId);
    const updated = await companyService.updateCompanySettings(req.companyId, req.body);

    await auditLogModel.record({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'company.settings.updated',
      resource: 'companies',
      resourceId: req.companyId,
      ipAddress: req.ip,
      previousValue: before,
      newValue: updated,
    });

    return ok(res, { company: updated }, 'Company settings updated');
  } catch (err) {
    return next(err);
  }
}

/** GET /api/companies/:id — Super Admin views any company. */
async function getCompanyById(req, res, next) {
  try {
    const company = await companyModel.findById(req.params.id);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    return ok(res, { company });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/companies — Super Admin lists/searches every company on the platform. */
async function listCompanies(req, res, next) {
  try {
    const { search, status } = req.query;
    const companies = await companyModel.listAll({ search, status });
    return ok(res, { companies });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/companies/:id/status — Super Admin suspends/activates a company. */
async function setCompanyStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['active', 'suspended', 'trial', 'cancelled'];
    if (!allowed.includes(status)) {
      throw new ApiError(422, `status must be one of: ${allowed.join(', ')}`);
    }
    const before = await companyModel.findById(req.params.id);
    if (!before) {
      throw new ApiError(404, 'Company not found');
    }
    const updated = await companyModel.setStatus(req.params.id, status);

    await auditLogModel.record({
      companyId: req.params.id,
      userId: req.user.id,
      action: 'company.status.changed',
      resource: 'companies',
      resourceId: req.params.id,
      ipAddress: req.ip,
      previousValue: { status: before.status },
      newValue: { status: updated.status },
    });

    return ok(res, { company: updated }, 'Company status updated');
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMyCompany, updateMyCompany, getCompanyById, listCompanies, setCompanyStatus };
