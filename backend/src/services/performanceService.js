const performanceGoalModel = require('../models/performanceGoalModel');
const performanceReviewModel = require('../models/performanceReviewModel');
const employeeModel = require('../models/employeeModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

/**
 * A Company Admin (or anyone explicitly granted performance:manage) can
 * manage performance for any employee in the company. A plain Manager
 * can only manage performance for their own direct reports — this is
 * checked here rather than in middleware because "own direct reports"
 * is a data relationship, not a static role/permission check.
 */
async function assertCanManageEmployee(req, employeeId) {
  const employee = await employeeModel.findByIdAndCompany(employeeId, req.companyId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const hasBroadAccess = req.user.roles.includes('super_admin')
    || req.user.roles.includes('company_admin')
    || req.user.permissions.includes('performance:manage');
  if (hasBroadAccess) return employee;

  if (req.user.roles.includes('manager')) {
    const managerEmployee = await employeeModel.findByUserId(req.user.id);
    if (managerEmployee && employee.manager_id === managerEmployee.id) {
      return employee;
    }
  }

  throw new ApiError(403, 'You can only manage performance for your own direct reports');
}

async function requireEmployeeForUser(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    throw new ApiError(404, 'No employee profile is linked to your account');
  }
  return employee;
}

// --- Goals -------------------------------------------------------------------

async function createGoal(req, payload) {
  await assertCanManageEmployee(req, payload.employeeId);
  return performanceGoalModel.create(req.companyId, { ...payload, createdBy: req.user.id });
}

async function listGoals(req, filters) {
  const hasBroadAccess = req.user.roles.includes('super_admin')
    || req.user.roles.includes('company_admin')
    || req.user.permissions.includes('performance:manage');

  if (hasBroadAccess) {
    return performanceGoalModel.listByCompany(req.companyId, filters);
  }

  if (filters.employeeId) {
    await assertCanManageEmployee(req, filters.employeeId);
    return performanceGoalModel.listByCompany(req.companyId, filters);
  }

  const managerEmployee = await employeeModel.findByUserId(req.user.id);
  if (!managerEmployee) return [];
  const { data: reports } = await employeeModel.listByCompany(req.companyId, { managerId: managerEmployee.id, pageSize: 1000 });
  const goalLists = await Promise.all(reports.map((r) => performanceGoalModel.listByCompany(req.companyId, { ...filters, employeeId: r.id })));
  return goalLists.flat();
}

async function getGoal(req, id) {
  const goal = await performanceGoalModel.findByIdAndCompany(id, req.companyId);
  if (!goal) throw new ApiError(404, 'Goal not found');
  await assertCanManageEmployee(req, goal.employee_id);
  return goal;
}

async function updateGoal(req, id, fields) {
  const goal = await getGoal(req, id);
  return performanceGoalModel.update(goal.id, req.companyId, fields);
}

async function updateGoalProgress(req, id, { progressPercent, status }) {
  const goal = await getGoal(req, id);
  const fields = {};
  if (progressPercent !== undefined) fields.progress_percent = progressPercent;
  if (status !== undefined) fields.status = status;
  return performanceGoalModel.update(goal.id, req.companyId, fields);
}

async function deleteGoal(req, id) {
  const goal = await getGoal(req, id);
  await performanceGoalModel.softDelete(goal.id, req.companyId);
}

async function getMyGoals(companyId, userId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return performanceGoalModel.listForEmployee(companyId, employee.id);
}

// --- Reviews -------------------------------------------------------------------

async function createReview(req, payload) {
  await assertCanManageEmployee(req, payload.employeeId);
  return performanceReviewModel.create(req.companyId, { ...payload, reviewerId: req.user.id });
}

async function listReviews(req, filters) {
  const hasBroadAccess = req.user.roles.includes('super_admin')
    || req.user.roles.includes('company_admin')
    || req.user.permissions.includes('performance:manage');

  if (hasBroadAccess) {
    return performanceReviewModel.listByCompany(req.companyId, filters);
  }
  if (filters.employeeId) {
    await assertCanManageEmployee(req, filters.employeeId);
    return performanceReviewModel.listByCompany(req.companyId, filters);
  }
  const managerEmployee = await employeeModel.findByUserId(req.user.id);
  if (!managerEmployee) return [];
  const { data: reports } = await employeeModel.listByCompany(req.companyId, { managerId: managerEmployee.id, pageSize: 1000 });
  const reviewLists = await Promise.all(reports.map((r) => performanceReviewModel.listByCompany(req.companyId, { ...filters, employeeId: r.id })));
  return reviewLists.flat();
}

async function getReview(req, id) {
  const review = await performanceReviewModel.findByIdAndCompany(id, req.companyId);
  if (!review) throw new ApiError(404, 'Review not found');
  await assertCanManageEmployee(req, review.employee_id);
  return review;
}

async function updateReview(req, id, fields) {
  const review = await getReview(req, id);
  if (!['draft', 'in_progress'].includes(review.status)) {
    throw new ApiError(422, 'This review can no longer be edited');
  }
  return performanceReviewModel.update(review.id, req.companyId, fields);
}

async function startReview(req, id) {
  const review = await getReview(req, id);
  if (review.status !== 'draft') throw new ApiError(422, 'Only a draft review can be started');
  return performanceReviewModel.setStatus(review.id, req.companyId, 'in_progress');
}

async function submitReview(req, id) {
  const review = await getReview(req, id);
  if (review.status !== 'in_progress') throw new ApiError(422, 'Only an in-progress review can be submitted');
  if (!review.overall_rating || !review.manager_feedback) {
    throw new ApiError(422, 'A rating and manager feedback are required before submitting');
  }
  const submitted = await performanceReviewModel.setStatus(review.id, req.companyId, 'submitted', { submitted_at: new Date() });
  const employee = await employeeModel.findByIdAndCompany(review.employee_id, req.companyId);
  await notificationService.notifyEmployee(req.companyId, employee, {
    type: 'performance_review',
    title: 'A performance review is ready for you',
    message: `${review.review_period_start} to ${review.review_period_end}`,
    link: '/dashboard/my-performance',
  });
  return submitted;
}

async function completeReview(req, id) {
  const review = await getReview(req, id);
  if (review.status !== 'reviewed') throw new ApiError(422, 'Only a reviewed review can be completed');
  return performanceReviewModel.setStatus(review.id, req.companyId, 'completed', { completed_at: new Date() });
}

// --- Employee self-service --------------------------------------------------

async function getMyReviews(companyId, userId) {
  const employee = await requireEmployeeForUser(companyId, userId);
  return performanceReviewModel.listVisibleForEmployee(companyId, employee.id);
}

async function acknowledgeReview(companyId, userId, id, comments) {
  const employee = await requireEmployeeForUser(companyId, userId);
  const review = await performanceReviewModel.findByIdAndCompany(id, companyId);
  if (!review || review.employee_id !== employee.id) {
    throw new ApiError(404, 'Review not found');
  }
  if (review.status !== 'submitted') {
    throw new ApiError(422, 'This review is not ready to be acknowledged yet');
  }
  const fields = {};
  if (comments !== undefined) fields.employee_comments = comments;
  if (Object.keys(fields).length > 0) {
    await performanceReviewModel.update(id, companyId, fields);
  }
  return performanceReviewModel.setStatus(id, companyId, 'reviewed', { reviewed_at: new Date() });
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
