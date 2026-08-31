const recruitmentService = require('../services/recruitmentService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

async function createJobPosting(req, res, next) {
  try {
    const posting = await recruitmentService.createJobPosting(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'job_posting.created',
      resource: 'job_postings', resourceId: posting.id, ipAddress: req.ip, newValue: { title: posting.title },
    });
    return created(res, { posting }, 'Job posting created');
  } catch (err) {
    return next(err);
  }
}

async function listJobPostings(req, res, next) {
  try {
    const { status, page, pageSize } = req.query;
    const result = await recruitmentService.listJobPostings(req.companyId, { status, page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getJobPosting(req, res, next) {
  try {
    const posting = await recruitmentService.getJobPosting(req.companyId, req.params.id);
    return ok(res, { posting });
  } catch (err) {
    return next(err);
  }
}

async function updateJobPosting(req, res, next) {
  try {
    const posting = await recruitmentService.updateJobPosting(req.companyId, req.params.id, req.body);
    return ok(res, { posting }, 'Job posting updated');
  } catch (err) {
    return next(err);
  }
}

async function publishJobPosting(req, res, next) {
  try {
    const posting = await recruitmentService.publishJobPosting(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'job_posting.published',
      resource: 'job_postings', resourceId: posting.id, ipAddress: req.ip,
    });
    return ok(res, { posting }, 'Job posting published');
  } catch (err) {
    return next(err);
  }
}

async function closeJobPosting(req, res, next) {
  try {
    const posting = await recruitmentService.closeJobPosting(req.companyId, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'job_posting.closed',
      resource: 'job_postings', resourceId: posting.id, ipAddress: req.ip,
    });
    return ok(res, { posting }, 'Job posting closed');
  } catch (err) {
    return next(err);
  }
}

async function listPublicJobs(req, res, next) {
  try {
    const jobs = await recruitmentService.listPublicJobs(req.params.companySlug);
    return ok(res, { jobs });
  } catch (err) {
    return next(err);
  }
}

async function getPublicJob(req, res, next) {
  try {
    const job = await recruitmentService.getPublicJob(req.params.companySlug, req.params.jobSlug);
    return ok(res, { job });
  } catch (err) {
    return next(err);
  }
}

async function submitApplication(req, res, next) {
  try {
    const application = await recruitmentService.submitApplication(req.params.companySlug, req.params.jobSlug, req.body);
    return created(res, { applicationId: application.id }, 'Application submitted. Thank you for applying!');
  } catch (err) {
    return next(err);
  }
}

async function listApplications(req, res, next) {
  try {
    const { jobPostingId, status, page, pageSize } = req.query;
    const result = await recruitmentService.listApplications(req.companyId, { jobPostingId, status, page, pageSize });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getApplication(req, res, next) {
  try {
    const application = await recruitmentService.getApplication(req.companyId, req.params.id);
    return ok(res, { application });
  } catch (err) {
    return next(err);
  }
}

async function setApplicationStatus(req, res, next) {
  try {
    const application = await recruitmentService.setApplicationStatus(req.companyId, req.params.id, req.body.status);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'application.status.changed',
      resource: 'job_applications', resourceId: application.id, ipAddress: req.ip, newValue: { status: application.status },
    });
    return ok(res, { application }, 'Application status updated');
  } catch (err) {
    return next(err);
  }
}

async function updateApplicationNotes(req, res, next) {
  try {
    const application = await recruitmentService.updateApplicationNotes(req.companyId, req.params.id, req.body.notes);
    return ok(res, { application }, 'Notes saved');
  } catch (err) {
    return next(err);
  }
}

async function scheduleInterview(req, res, next) {
  try {
    const interview = await recruitmentService.scheduleInterview(req.companyId, req.params.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'interview.scheduled',
      resource: 'interviews', resourceId: interview.id, ipAddress: req.ip,
      newValue: { scheduled_at: interview.scheduled_at },
    });
    return created(res, { interview }, 'Interview scheduled');
  } catch (err) {
    return next(err);
  }
}

async function listInterviews(req, res, next) {
  try {
    const interviews = await recruitmentService.listInterviews(req.companyId, req.params.id);
    return ok(res, { interviews });
  } catch (err) {
    return next(err);
  }
}

async function updateInterview(req, res, next) {
  try {
    const interview = await recruitmentService.updateInterview(req.companyId, req.params.id, req.body);
    return ok(res, { interview }, 'Interview updated');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createJobPosting,
  listJobPostings,
  getJobPosting,
  updateJobPosting,
  publishJobPosting,
  closeJobPosting,
  listPublicJobs,
  getPublicJob,
  submitApplication,
  listApplications,
  getApplication,
  setApplicationStatus,
  updateApplicationNotes,
  scheduleInterview,
  listInterviews,
  updateInterview,
};
