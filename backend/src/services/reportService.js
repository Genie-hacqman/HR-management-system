const employeeModel = require('../models/employeeModel');
const attendanceModel = require('../models/attendanceModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const payrollModel = require('../models/payrollModel');
const payrollItemModel = require('../models/payrollItemModel');
const jobPostingModel = require('../models/jobPostingModel');
const jobApplicationModel = require('../models/jobApplicationModel');
const performanceGoalModel = require('../models/performanceGoalModel');
const performanceReviewModel = require('../models/performanceReviewModel');
const { ApiError } = require('../utils/apiResponse');

const MAX_REPORT_ROWS = 5000;

const EMPLOYEE_COLUMNS = [
  { key: 'employee_code', label: 'Employee ID' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'department_name', label: 'Department' },
  { key: 'position_title', label: 'Position' },
  { key: 'employment_type', label: 'Employment type' },
  { key: 'employment_status', label: 'Status' },
  { key: 'employment_date', label: 'Employment date' },
];

async function employeeReport(companyId, filters) {
  const { data } = await employeeModel.listByCompany(companyId, { ...filters, pageSize: MAX_REPORT_ROWS });
  return { columns: EMPLOYEE_COLUMNS, rows: data };
}

const ATTENDANCE_COLUMNS = [
  { key: 'work_date', label: 'Date' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'employee_code', label: 'Employee ID' },
  { key: 'department_name', label: 'Department' },
  { key: 'clock_in_at', label: 'Clock in' },
  { key: 'clock_out_at', label: 'Clock out' },
  { key: 'total_minutes', label: 'Total minutes' },
  { key: 'status', label: 'Status' },
];

async function attendanceReport(companyId, filters) {
  if (!filters.dateFrom || !filters.dateTo) {
    throw new ApiError(422, 'dateFrom and dateTo are required for the attendance report');
  }
  const { data } = await attendanceModel.listByCompany(companyId, { ...filters, pageSize: MAX_REPORT_ROWS });
  return { columns: ATTENDANCE_COLUMNS, rows: data };
}

const LEAVE_COLUMNS = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'department_name', label: 'Department' },
  { key: 'leave_type_name', label: 'Leave type' },
  { key: 'start_date', label: 'Start date' },
  { key: 'end_date', label: 'End date' },
  { key: 'total_days', label: 'Days' },
  { key: 'status', label: 'Status' },
];

async function leaveReport(companyId, filters) {
  const { data } = await leaveRequestModel.listByCompany(companyId, { ...filters, pageSize: MAX_REPORT_ROWS });
  return { columns: LEAVE_COLUMNS, rows: data };
}

const PAYROLL_COLUMNS = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'department_name', label: 'Department' },
  { key: 'basic_salary', label: 'Basic salary' },
  { key: 'allowances', label: 'Allowances' },
  { key: 'bonuses', label: 'Bonuses' },
  { key: 'deductions', label: 'Deductions' },
  { key: 'tax', label: 'Tax' },
  { key: 'net_salary', label: 'Net salary' },
  { key: 'payment_status', label: 'Payment status' },
];

async function payrollReport(companyId, payrollId) {
  if (!payrollId) throw new ApiError(422, 'payrollId is required for the payroll report');
  const payroll = await payrollModel.findByIdAndCompany(payrollId, companyId);
  if (!payroll) throw new ApiError(404, 'Payroll period not found');
  const items = await payrollItemModel.listByPayroll(companyId, payrollId);
  const totalNet = items.reduce((sum, i) => sum + Number(i.net_salary), 0);
  return { columns: PAYROLL_COLUMNS, rows: items, summary: { payroll, totalNet, employeeCount: items.length } };
}

const RECRUITMENT_COLUMNS = [
  { key: 'applicant_first_name', label: 'First name' },
  { key: 'applicant_last_name', label: 'Last name' },
  { key: 'applicant_email', label: 'Email' },
  { key: 'job_title', label: 'Job' },
  { key: 'status', label: 'Pipeline stage' },
  { key: 'created_at', label: 'Applied on' },
];

function stageCounts(applications) {
  const stages = ['applied', 'screening', 'interview', 'shortlisted', 'hired', 'rejected'];
  const counts = {};
  stages.forEach((s) => { counts[s] = 0; });
  applications.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
  return counts;
}

async function recruitmentReport(companyId, filters) {
  const { data } = await jobApplicationModel.listByCompany(companyId, { ...filters, pageSize: MAX_REPORT_ROWS });
  const { data: postings } = await jobPostingModel.listByCompany(companyId, { pageSize: MAX_REPORT_ROWS });
  const summary = {
    openPostings: postings.filter((p) => p.status === 'published').length,
    totalApplications: data.length,
    byStage: stageCounts(data),
  };
  return { columns: RECRUITMENT_COLUMNS, rows: data, summary };
}

const PERFORMANCE_COLUMNS = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'review_period_start', label: 'Period start' },
  { key: 'review_period_end', label: 'Period end' },
  { key: 'overall_rating', label: 'Rating' },
  { key: 'status', label: 'Status' },
];

async function performanceReport(companyId, filters) {
  const reviews = await performanceReviewModel.listByCompany(companyId, filters);
  const goals = await performanceGoalModel.listByCompany(companyId, filters);
  const completedReviews = reviews.filter((r) => r.status === 'completed');
  const avgRating = completedReviews.length
    ? completedReviews.reduce((sum, r) => sum + Number(r.overall_rating || 0), 0) / completedReviews.length
    : null;
  const summary = {
    totalReviews: reviews.length,
    completedReviews: completedReviews.length,
    averageRating: avgRating ? Math.round(avgRating * 100) / 100 : null,
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.status === 'completed').length,
  };
  return { columns: PERFORMANCE_COLUMNS, rows: reviews, summary };
}

module.exports = {
  employeeReport,
  attendanceReport,
  leaveReport,
  payrollReport,
  recruitmentReport,
  performanceReport,
};
