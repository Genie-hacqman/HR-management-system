const express = require('express');
const rateLimit = require('express-rate-limit');
const recruitmentController = require('../controllers/recruitmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createJobPostingValidator,
  updateJobPostingValidator,
  submitApplicationValidator,
  setApplicationStatusValidator,
  scheduleInterviewValidator,
  updateInterviewValidator,
} = require('../validators/recruitmentValidators');

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

router.get('/public/:companySlug/jobs', publicLimiter, recruitmentController.listPublicJobs);
router.get('/public/:companySlug/jobs/:jobSlug', publicLimiter, recruitmentController.getPublicJob);
router.post(
  '/public/:companySlug/jobs/:jobSlug/apply',
  publicLimiter,
  submitApplicationValidator,
  validate,
  recruitmentController.submitApplication
);

router.use(authMiddleware, companyMiddleware);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('recruitment:manage')];

router.post('/jobs', canManage, createJobPostingValidator, validate, recruitmentController.createJobPosting);
router.get('/jobs', canManage, recruitmentController.listJobPostings);
router.get('/jobs/:id', canManage, recruitmentController.getJobPosting);
router.put('/jobs/:id', canManage, updateJobPostingValidator, validate, recruitmentController.updateJobPosting);
router.post('/jobs/:id/publish', canManage, recruitmentController.publishJobPosting);
router.post('/jobs/:id/close', canManage, recruitmentController.closeJobPosting);

router.get('/applications', canManage, recruitmentController.listApplications);
router.get('/applications/:id', canManage, recruitmentController.getApplication);
router.patch(
  '/applications/:id/status',
  canManage,
  setApplicationStatusValidator,
  validate,
  recruitmentController.setApplicationStatus
);
router.put('/applications/:id/notes', canManage, recruitmentController.updateApplicationNotes);

router.post(
  '/applications/:id/interviews',
  canManage,
  scheduleInterviewValidator,
  validate,
  recruitmentController.scheduleInterview
);
router.get('/applications/:id/interviews', canManage, recruitmentController.listInterviews);
router.put('/interviews/:id', canManage, updateInterviewValidator, validate, recruitmentController.updateInterview);

module.exports = router;
