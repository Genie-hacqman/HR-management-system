const performanceService = require('../services/performanceService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

async function createGoal(req, res, next) {
  try {
    const goal = await performanceService.createGoal(req, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'performance_goal.created',
      resource: 'performance_goals', resourceId: goal.id, ipAddress: req.ip, newValue: { title: goal.title },
    });
    return created(res, { goal }, 'Goal created');
  } catch (err) {
    return next(err);
  }
}

async function listGoals(req, res, next) {
  try {
    const { employeeId, status } = req.query;
    const goals = await performanceService.listGoals(req, { employeeId, status });
    return ok(res, { goals });
  } catch (err) {
    return next(err);
  }
}

async function getGoal(req, res, next) {
  try {
    const goal = await performanceService.getGoal(req, req.params.id);
    return ok(res, { goal });
  } catch (err) {
    return next(err);
  }
}

async function updateGoal(req, res, next) {
  try {
    const goal = await performanceService.updateGoal(req, req.params.id, req.body);
    return ok(res, { goal }, 'Goal updated');
  } catch (err) {
    return next(err);
  }
}

async function updateGoalProgress(req, res, next) {
  try {
    const goal = await performanceService.updateGoalProgress(req, req.params.id, req.body);
    return ok(res, { goal }, 'Progress updated');
  } catch (err) {
    return next(err);
  }
}

async function deleteGoal(req, res, next) {
  try {
    await performanceService.deleteGoal(req, req.params.id);
    return ok(res, null, 'Goal removed');
  } catch (err) {
    return next(err);
  }
}

async function getMyGoals(req, res, next) {
  try {
    const goals = await performanceService.getMyGoals(req.companyId, req.user.id);
    return ok(res, { goals });
  } catch (err) {
    return next(err);
  }
}

async function createReview(req, res, next) {
  try {
    const review = await performanceService.createReview(req, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'performance_review.created',
      resource: 'performance_reviews', resourceId: review.id, ipAddress: req.ip,
    });
    return created(res, { review }, 'Review created');
  } catch (err) {
    return next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const { employeeId, status } = req.query;
    const reviews = await performanceService.listReviews(req, { employeeId, status });
    return ok(res, { reviews });
  } catch (err) {
    return next(err);
  }
}

async function getReview(req, res, next) {
  try {
    const review = await performanceService.getReview(req, req.params.id);
    return ok(res, { review });
  } catch (err) {
    return next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const review = await performanceService.updateReview(req, req.params.id, req.body);
    return ok(res, { review }, 'Review updated');
  } catch (err) {
    return next(err);
  }
}

async function startReview(req, res, next) {
  try {
    const review = await performanceService.startReview(req, req.params.id);
    return ok(res, { review }, 'Review started');
  } catch (err) {
    return next(err);
  }
}

async function submitReview(req, res, next) {
  try {
    const review = await performanceService.submitReview(req, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'performance_review.submitted',
      resource: 'performance_reviews', resourceId: review.id, ipAddress: req.ip,
    });
    return ok(res, { review }, 'Review submitted');
  } catch (err) {
    return next(err);
  }
}

async function completeReview(req, res, next) {
  try {
    const review = await performanceService.completeReview(req, req.params.id);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'performance_review.completed',
      resource: 'performance_reviews', resourceId: review.id, ipAddress: req.ip,
    });
    return ok(res, { review }, 'Review completed');
  } catch (err) {
    return next(err);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const reviews = await performanceService.getMyReviews(req.companyId, req.user.id);
    return ok(res, { reviews });
  } catch (err) {
    return next(err);
  }
}

async function acknowledgeReview(req, res, next) {
  try {
    const review = await performanceService.acknowledgeReview(req.companyId, req.user.id, req.params.id, req.body.comments);
    return ok(res, { review }, 'Review acknowledged');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createGoal,
  listGoals,
  getGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getMyGoals,
  createReview,
  listReviews,
  getReview,
  updateReview,
  startReview,
  submitReview,
  completeReview,
  getMyReviews,
  acknowledgeReview,
};
