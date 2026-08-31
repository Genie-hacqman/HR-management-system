import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardHome from '../pages/admin/DashboardHome';
import CompanySettings from '../pages/admin/CompanySettings';
import TeamManagement from '../pages/admin/TeamManagement';
import PlatformOverview from '../pages/admin/PlatformOverview';
import Departments from '../pages/admin/Departments';
import Positions from '../pages/admin/Positions';
import Employees from '../pages/admin/Employees';
import EmployeeForm from '../pages/admin/EmployeeForm';
import EmployeeDetail from '../pages/admin/EmployeeDetail';
import MyProfile from '../pages/employee/MyProfile';
import MyAttendance from '../pages/employee/MyAttendance';
import MyLeave from '../pages/employee/MyLeave';
import MyPayslips from '../pages/employee/MyPayslips';
import MyPerformance from '../pages/employee/MyPerformance';
import MyDocuments from '../pages/employee/MyDocuments';
import MyTeam from '../pages/manager/MyTeam';
import TeamAttendance from '../pages/manager/TeamAttendance';
import TeamLeave from '../pages/manager/TeamLeave';
import Attendance from '../pages/admin/Attendance';
import LeaveManagement from '../pages/admin/LeaveManagement';
import Payroll from '../pages/admin/Payroll';
import Recruitment from '../pages/admin/Recruitment';
import PerformanceManagement from '../pages/admin/PerformanceManagement';
import Documents from '../pages/admin/Documents';
import Reports from '../pages/admin/Reports';
import AuditLogs from '../pages/admin/AuditLogs';
import Announcements from '../pages/shared/Announcements';
import CareersList from '../pages/public/CareersList';
import JobDetail from '../pages/public/JobDetail';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/careers/:companySlug" element={<CareersList />} />
      <Route path="/careers/:companySlug/:jobSlug" element={<JobDetail />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route
          path="team"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="company"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
              <CompanySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="platform"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <PlatformOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="positions"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Positions />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/new"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <EmployeeForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <EmployeeForm />
            </ProtectedRoute>
          }
        />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="my-attendance" element={<MyAttendance />} />
        <Route path="my-leave" element={<MyLeave />} />
        <Route path="my-payslips" element={<MyPayslips />} />
        <Route path="my-performance" element={<MyPerformance />} />
        <Route path="my-documents" element={<MyDocuments />} />
        <Route path="announcements" element={<Announcements />} />
        <Route
          path="my-team"
          element={
            <ProtectedRoute allowedRoles={['manager', 'company_admin']}>
              <MyTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="team-attendance"
          element={
            <ProtectedRoute allowedRoles={['manager', 'company_admin']}>
              <TeamAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="team-leave"
          element={
            <ProtectedRoute allowedRoles={['manager', 'company_admin']}>
              <TeamLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="payroll"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="recruitment"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Recruitment />
            </ProtectedRoute>
          }
        />
        <Route
          path="performance"
          element={
            <ProtectedRoute allowedRoles={['company_admin', 'manager']}>
              <PerformanceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="documents"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
