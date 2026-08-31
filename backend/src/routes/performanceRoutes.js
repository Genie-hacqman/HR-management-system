const express = require('express');
const performanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createGoalValidator,
  updateGoalValidator,
  updateGoalProgressValidator,
  createReviewValidator,
  updateReviewValidator,
  acknowledgeReviewValidator,
} = require('../validators/performanceValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/goals/me', performanceController.getMyGoals);
router.get('/reviews/me', performanceController.getMyReviews);
router.post('/reviews/:id/acknowledge', acknowledgeReviewValidator, validate, performanceController.acknowledgeReview);

// Fine-grained "own reports vs. company-wide" scoping happens in
// performanceService.assertCanManageEmployee, not here — a Manager and
// a Company Admin share the same routes but see different data.
const canManageRole = roleMiddleware('company_admin', 'manager');

router.post('/goals', canManageRole, createGoalValidator, validate, performanceController.createGoal);
router.get('/goals', canManageRole, performanceController.listGoals);
router.get('/goals/:id', canManageRole, performanceController.getGoal);
router.put('/goals/:id', canManageRole, updateGoalValidator, validate, performanceController.updateGoal);
router.patch('/goals/:id/progress', canManageRole, updateGoalProgressValidator, validate, performanceController.updateGoalProgress);
router.delete('/goals/:id', canManageRole, performanceController.deleteGoal);

router.post('/reviews', canManageRole, createReviewValidator, validate, performanceController.createReview);
router.get('/reviews', canManageRole, performanceController.listReviews);
router.get('/reviews/:id', canManageRole, performanceController.getReview);
router.put('/reviews/:id', canManageRole, updateReviewValidator, validate, performanceController.updateReview);
router.post('/reviews/:id/start', canManageRole, performanceController.startReview);
router.post('/reviews/:id/submit', canManageRole, performanceController.submitReview);
router.post('/reviews/:id/complete', canManageRole, performanceController.completeReview);

module.exports = router;
