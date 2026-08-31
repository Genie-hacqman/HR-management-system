const { pool } = require('../config/db');
const employeeModel = require('../models/employeeModel');
const departmentModel = require('../models/departmentModel');
const attendanceModel = require('../models/attendanceModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const payrollModel = require('../models/payrollModel');
const payrollItemModel = require('../models/payrollItemModel');
const jobPostingModel = require('../models/jobPostingModel');
const jobApplicationModel = require('../models/jobApplicationModel');
const performanceReviewModel = require('../models/performanceReviewModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');
const payslipModel = require('../models/payslipModel');
const documentModel = require('../models/documentModel');
const announcementModel = require('../models/announcementModel');
const notificationModel = require('../models/notificationModel');
const auditLogModel = require('../models/auditLogModel');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function upcomingBirthdays(employees, days = 30) {
  const now = new Date();
  return employees
    .filter((e) => e.date_of_birth)
    .map((e) => {
      const dob = new Date(e.date_of_birth);
      const nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
      const daysAway = Math.round((nextBirthday - now) / (1000 * 60 * 60 * 24));
      return { ...e, daysAway };
    })
    .filter((e) => e.daysAway <= days)
    .sort((a, b) => a.daysAway - b.daysAway);
}

async function getAdminDashboard(companyId) {
  const { data: allEmployees } = await employeeModel.listByCompany(companyId, { pageSize: 100000 });
  const activeEmployees = allEmployees.filter((e) => e.employment_status === 'active');

  const departments = await departmentModel.listByCompany(companyId);

  const attendanceStats = await attendanceModel.getStatsForDate(companyId, todayISO());

  const { data: pendingLeave } = await leaveRequestModel.listByCompany(companyId, { status: 'pending', pageSize: 100000 });

  const { data: recentPayrolls } = await payrollModel.listByCompany(companyId, { status: 'processed', pageSize: 1 });
  let payrollSummary = null;
  if (recentPayrolls[0]) {
    const items = await payrollItemModel.listByPayroll(companyId, recentPayrolls[0].id);
    payrollSummary = {
      period: `${recentPayrolls[0].period_start} to ${recentPayrolls[0].period_end}`,
      totalNet: items.reduce((sum, i) => sum + Number(i.net_salary), 0),
      employeeCount: items.length,
    };
  }

  const { data: publishedJobs } = await jobPostingModel.listByCompany(companyId, { status: 'published', pageSize: 1000 });
  const { data: allApplications } = await jobApplicationModel.listByCompany(companyId, { pageSize: 100000 });

  const recentActivity = await auditLogModel.list({ companyId, limit: 10 });

  return {
    totalEmployees: allEmployees.length,
    activeEmployees: activeEmployees.length,
    totalDepartments: departments.length,
    attendanceToday: attendanceStats,
    pendingLeaveRequests: pendingLeave.length,
    payrollSummary,
    recruitment: { openPostings: publishedJobs.length, totalApplications: allApplications.length },
    upcomingBirthdays: upcomingBirthdays(activeEmployees),
    recentActivity,
  };
}

async function getManagerDashboard(companyId, userId) {
  const managerEmployee = await employeeModel.findByUserId(userId);
  if (!managerEmployee || managerEmployee.company_id !== companyId) {
    return { teamSize: 0, team: [] };
  }

  const { data: reports } = await employeeModel.listByCompany(companyId, { managerId: managerEmployee.id, pageSize: 1000 });
  const reportIds = reports.map((r) => r.id);

  const teamAttendanceToday = await attendanceModel.listForManagerTeam(companyId, managerEmployee.id, { date: todayISO() });
  const presentToday = teamAttendanceToday.filter((a) => ['present', 'late', 'half_day'].includes(a.status)).length;

  const teamLeaveRequests = await leaveRequestModel.listForManagerTeam(companyId, managerEmployee.id, { status: 'pending' });

  const allReviews = await performanceReviewModel.listByCompany(companyId, {});
  const teamReviews = reportIds.length ? allReviews.filter((r) => reportIds.includes(r.employee_id)) : [];
  const completedTeamReviews = teamReviews.filter((r) => r.status === 'completed' && r.overall_rating);
  const avgTeamRating = completedTeamReviews.length
    ? Math.round((completedTeamReviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / completedTeamReviews.length) * 100) / 100
    : null;

  let recentActivity = [];
  if (reportIds.length) {
    const [rows] = await pool.query(
      `SELECT * FROM audit_logs
       WHERE company_id = :companyId AND resource_id IN (:reportIds) AND resource IN ('employees', 'attendance_records', 'leave_requests')
       ORDER BY created_at DESC LIMIT 10`,
      { companyId, reportIds }
    );
    recentActivity = rows;
  }

  return {
    teamSize: reports.length,
    teamAttendanceToday: { present: presentToday, total: reports.length },
    pendingLeaveRequests: teamLeaveRequests.length,
    teamAverageRating: avgTeamRating,
    upcomingBirthdays: upcomingBirthdays(reports),
    recentActivity,
  };
}

async function getEmployeeDashboard(companyId, userId) {
  const employee = await employeeModel.findByUserId(userId);
  if (!employee || employee.company_id !== companyId) {
    return null;
  }

  const todayAttendance = await attendanceModel.findByEmployeeAndDate(employee.id, todayISO());
  const leaveBalances = await leaveBalanceModel.listForEmployee(companyId, employee.id, new Date().getFullYear());
  const { data: payslips } = await payslipModel.listForEmployee(companyId, employee.id, { pageSize: 1 });
  const documents = await documentModel.listForEmployee(companyId, employee.id);
  const announcements = await announcementModel.listByCompany(companyId);
  const unreadNotifications = await notificationModel.countUnread(userId);
  const reviews = await performanceReviewModel.listVisibleForEmployee(companyId, employee.id);

  return {
    profile: employee,
    todayAttendance,
    leaveBalances,
    latestPayslip: payslips[0] || null,
    upcomingAnnouncements: announcements.slice(0, 3),
    documentCount: documents.length,
    unreadNotifications,
    latestPerformanceReview: reviews[0] || null,
  };
}

module.exports = { getAdminDashboard, getManagerDashboard, getEmployeeDashboard };
