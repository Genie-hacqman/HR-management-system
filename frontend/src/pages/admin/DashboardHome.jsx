import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as dashboardService from '../../services/dashboardService';

export default function DashboardHome() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  if (roles.includes('company_admin')) return <AdminDashboard />;
  if (roles.includes('manager')) return <ManagerDashboard />;
  return <EmployeeDashboard />;
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-navy-900">{value ?? '—'}</p>
    </div>
  );
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.getAdminDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard.'));
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!dashboard) return <p className="text-sm text-ink/50">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Company overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total employees" value={dashboard.totalEmployees} />
        <StatCard label="Active employees" value={dashboard.activeEmployees} />
        <StatCard label="Departments" value={dashboard.totalDepartments} />
        <StatCard label="Present today" value={dashboard.attendanceToday?.present} />
        <StatCard label="Late today" value={dashboard.attendanceToday?.late} />
        <StatCard label="Absent today" value={dashboard.attendanceToday?.absent} />
        <StatCard label="Pending leave" value={dashboard.pendingLeaveRequests} />
        <StatCard label="Open job postings" value={dashboard.recruitment?.openPostings} />
      </div>

      {dashboard.payrollSummary && (
        <div className="card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Last payroll run</p>
          <p className="mt-1 text-sm">
            {dashboard.payrollSummary.period} · {dashboard.payrollSummary.employeeCount} employees ·{' '}
            <span className="font-semibold">${Number(dashboard.payrollSummary.totalNet).toLocaleString()}</span> net
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-semibold">Upcoming birthdays</p>
          <ul className="mt-3 space-y-2 text-sm">
            {dashboard.upcomingBirthdays.length === 0 && <li className="text-ink/40">None in the next 30 days.</li>}
            {dashboard.upcomingBirthdays.slice(0, 6).map((e) => (
              <li key={e.id} className="flex justify-between">
                <span>{e.first_name} {e.last_name}</span>
                <span className="text-ink/50">{e.daysAway === 0 ? 'Today' : `in ${e.daysAway}d`}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold">Recent activity</p>
          <ul className="mt-3 space-y-2 text-sm">
            {dashboard.recentActivity.length === 0 && <li className="text-ink/40">No recent activity.</li>}
            {dashboard.recentActivity.slice(0, 6).map((log) => (
              <li key={log.id} className="flex justify-between">
                <span>{log.action.replace(/[._]/g, ' ')}</span>
                <span className="text-ink/40">{new Date(log.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.getManagerDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard.'));
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!dashboard) return <p className="text-sm text-ink/50">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Team overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Team size" value={dashboard.teamSize} />
        <StatCard label="Present today" value={`${dashboard.teamAttendanceToday?.present ?? 0} / ${dashboard.teamAttendanceToday?.total ?? 0}`} />
        <StatCard label="Pending leave" value={dashboard.pendingLeaveRequests} />
        <StatCard label="Avg. rating" value={dashboard.teamAverageRating ? `${dashboard.teamAverageRating} / 5` : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-semibold">Upcoming birthdays</p>
          <ul className="mt-3 space-y-2 text-sm">
            {dashboard.upcomingBirthdays?.length === 0 && <li className="text-ink/40">None in the next 30 days.</li>}
            {dashboard.upcomingBirthdays?.slice(0, 6).map((e) => (
              <li key={e.id} className="flex justify-between">
                <span>{e.first_name} {e.last_name}</span>
                <span className="text-ink/50">{e.daysAway === 0 ? 'Today' : `in ${e.daysAway}d`}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold">Recent team activity</p>
          <ul className="mt-3 space-y-2 text-sm">
            {dashboard.recentActivity?.length === 0 && <li className="text-ink/40">No recent activity.</li>}
            {dashboard.recentActivity?.slice(0, 6).map((log) => (
              <li key={log.id} className="flex justify-between">
                <span>{log.action.replace(/[._]/g, ' ')}</span>
                <span className="text-ink/40">{new Date(log.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.getEmployeeDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard.'));
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Welcome, {user?.firstName}</h1>

      {!dashboard ? (
        <p className="text-sm text-ink/50">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Clock-in status" value={dashboard.todayAttendance?.clock_in_at ? 'Clocked in' : 'Not clocked in'} />
            <StatCard label="Documents" value={dashboard.documentCount} />
            <StatCard label="Unread notifications" value={dashboard.unreadNotifications} />
            <StatCard
              label="Latest payslip"
              value={dashboard.latestPayslip ? `$${Number(dashboard.latestPayslip.net_salary).toLocaleString()}` : '—'}
            />
          </div>

          {dashboard.leaveBalances?.length > 0 && (
            <div className="card p-6">
              <p className="text-sm font-semibold">Leave balances</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {dashboard.leaveBalances.map((b) => (
                  <div key={b.leave_type_name}>
                    <p className="text-xs text-ink/50">{b.leave_type_name}</p>
                    <p className="text-sm font-medium">
                      {b.is_paid && Number(b.allocated_days) > 0
                        ? `${(Number(b.allocated_days) - Number(b.used_days)).toFixed(1)} / ${Number(b.allocated_days).toFixed(0)}`
                        : 'Unlimited'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard.latestPerformanceReview && (
            <div className="card p-6">
              <p className="text-sm font-semibold">Latest performance review</p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <StatusBadge status={dashboard.latestPerformanceReview.status} />
                <span>{dashboard.latestPerformanceReview.review_period_start} → {dashboard.latestPerformanceReview.review_period_end}</span>
              </div>
            </div>
          )}

          {dashboard.upcomingAnnouncements?.length > 0 && (
            <div className="card p-6">
              <p className="text-sm font-semibold">Latest announcements</p>
              <ul className="mt-3 space-y-2 text-sm">
                {dashboard.upcomingAnnouncements.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
