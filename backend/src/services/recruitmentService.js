const slugify = require('slugify');
const jobPostingModel = require('../models/jobPostingModel');
const jobApplicationModel = require('../models/jobApplicationModel');
const interviewModel = require('../models/interviewModel');
const companyModel = require('../models/companyModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

const PIPELINE_STATUSES = ['applied', 'screening', 'interview', 'shortlisted', 'hired', 'rejected'];

async function generateUniqueSlug(companyId, title) {
  const base = slugify(title, { lower: true, strict: true });
  let candidate = base;
  let counter = 1;
  while (await jobPostingModel.findBySlugAndCompany(candidate, companyId)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

// --- Job postings (Company Admin / HR) --------------------------------------

async function createJobPosting(companyId, userId, payload) {
  const slug = await generateUniqueSlug(companyId, payload.title);
  return jobPostingModel.create(companyId, {
    title: payload.title,
    slug,
    description: payload.description ?? null,
    requirements: payload.requirements ?? null,
    location: payload.location ?? null,
    employmentType: payload.employmentType ?? 'full_time',
    departmentId: payload.departmentId ?? null,
    positionId: payload.positionId ?? null,
    postedBy: userId,
  });
}

async function listJobPostings(companyId, filters) {
  return jobPostingModel.listByCompany(companyId, filters);
}

async function getJobPosting(companyId, id) {
  const posting = await jobPostingModel.findByIdAndCompany(id, companyId);
  if (!posting) throw new ApiError(404, 'Job posting not found');
  return posting;
}

async function updateJobPosting(companyId, id, fields) {
  await getJobPosting(companyId, id);
  return jobPostingModel.update(id, companyId, fields);
}

async function publishJobPosting(companyId, id) {
  const posting = await getJobPosting(companyId, id);
  if (posting.status === 'published') throw new ApiError(422, 'This job posting is already published');
  return jobPostingModel.setStatus(id, companyId, 'published', { published_at: new Date() });
}

async function closeJobPosting(companyId, id) {
  const posting = await getJobPosting(companyId, id);
  if (posting.status === 'closed') throw new ApiError(422, 'This job posting is already closed');
  return jobPostingModel.setStatus(id, companyId, 'closed', { closed_at: new Date() });
}

// --- Public (unauthenticated) ------------------------------------------------

async function getPublicCompany(companySlug) {
  const company = await companyModel.findBySlug(companySlug);
  if (!company || company.status === 'suspended' || company.status === 'cancelled') {
    throw new ApiError(404, 'This company page is not available');
  }
  return company;
}

async function listPublicJobs(companySlug) {
  const company = await getPublicCompany(companySlug);
  return jobPostingModel.listPublishedForCompany(company.id);
}

async function getPublicJob(companySlug, jobSlug) {
  const company = await getPublicCompany(companySlug);
  const posting = await jobPostingModel.findPublishedBySlug(company.id, jobSlug);
  if (!posting) throw new ApiError(404, 'This job posting is no longer available');
  return posting;
}

async function submitApplication(companySlug, jobSlug, payload) {
  const posting = await getPublicJob(companySlug, jobSlug);
  const application = await jobApplicationModel.submit(posting.company_id, posting.id, payload);
  await notificationService.notifyCompanyAdmins(posting.company_id, {
    type: 'recruitment_update',
    title: `New application for ${posting.title}`,
    message: `${payload.firstName} ${payload.lastName} applied`,
    link: '/dashboard/recruitment',
  });
  return application;
}

// --- Applications / pipeline (Company Admin / HR) ----------------------------

async function listApplications(companyId, filters) {
  return jobApplicationModel.listByCompany(companyId, filters);
}

async function getApplication(companyId, id) {
  const application = await jobApplicationModel.findByIdAndCompany(id, companyId);
  if (!application) throw new ApiError(404, 'Application not found');
  return application;
}

async function setApplicationStatus(companyId, id, status) {
  if (!PIPELINE_STATUSES.includes(status)) {
    throw new ApiError(422, `status must be one of: ${PIPELINE_STATUSES.join(', ')}`);
  }
  await getApplication(companyId, id);
  return jobApplicationModel.setStatus(id, companyId, status);
}

async function updateApplicationNotes(companyId, id, notes) {
  await getApplication(companyId, id);
  return jobApplicationModel.updateNotes(id, companyId, notes);
}

// --- Interviews --------------------------------------------------------------

async function scheduleInterview(companyId, applicationId, payload) {
  await getApplication(companyId, applicationId);
  const interview = await interviewModel.create(companyId, applicationId, payload);
  const application = await jobApplicationModel.findByIdAndCompany(applicationId, companyId);
  if (application.status === 'applied' || application.status === 'screening') {
    await jobApplicationModel.setStatus(applicationId, companyId, 'interview');
  }
  return interview;
}

async function listInterviews(companyId, applicationId) {
  await getApplication(companyId, applicationId);
  return interviewModel.listForApplication(companyId, applicationId);
}

async function updateInterview(companyId, id, fields) {
  const interview = await interviewModel.findByIdAndCompany(id, companyId);
  if (!interview) throw new ApiError(404, 'Interview not found');
  return interviewModel.update(id, companyId, fields);
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
  PIPELINE_STATUSES,
};
