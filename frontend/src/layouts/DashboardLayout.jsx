import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/ui/NotificationBell';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const roles = user?.roles || [];

  
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(roles.includes('company_admin') || roles.includes('manager')
      ? [{ to: '/dashboard/employees', label: 'Employees' }]
      : []),
    ...(roles.includes('company_admin') || roles.includes('manager')
      ? [{ to: '/dashboard/attendance', label: 'Attendance' }]
      : []),
    ...(roles.includes('company_admin') || roles.includes('manager')
      ? [{ to: '/dashboard/leave', label: 'Leave' }]
      : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/payroll', label: 'Payroll' }] : []),
    ...(roles.includes('company_admin') || roles.includes('manager')
      ? [{ to: '/dashboard/performance', label: 'Performance' }]
      : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/recruitment', label: 'Recruitment' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/documents', label: 'Documents' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/reports', label: 'Reports' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/audit-logs', label: 'Audit Logs' }] : []),
    { to: '/dashboard/announcements', label: 'Announcements' },
    ...(roles.includes('manager') ? [{ to: '/dashboard/my-team', label: 'My Team' }] : []),
    ...(roles.includes('manager') ? [{ to: '/dashboard/team-attendance', label: 'Team Attendance' }] : []),
    ...(roles.includes('manager') ? [{ to: '/dashboard/team-leave', label: 'Team Leave' }] : []),
    ...(!roles.includes('company_admin') ? [{ to: '/dashboard/my-attendance', label: 'My Attendance' }] : []),
    ...(!roles.includes('company_admin') ? [{ to: '/dashboard/my-leave', label: 'My Leave' }] : []),
    ...(!roles.includes('company_admin') ? [{ to: '/dashboard/my-payslips', label: 'My Payslips' }] : []),
    ...(!roles.includes('company_admin') ? [{ to: '/dashboard/my-performance', label: 'My Performance' }] : []),
    ...(!roles.includes('company_admin') ? [{ to: '/dashboard/my-documents', label: 'My Documents' }] : []),
    ...(roles.includes('employee') && !roles.includes('company_admin') && !roles.includes('manager')
      ? [{ to: '/dashboard/my-profile', label: 'My Profile' }]
      : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/departments', label: 'Departments' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/positions', label: 'Positions' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/team', label: 'Team' }] : []),
    ...(roles.includes('company_admin') ? [{ to: '/dashboard/company', label: 'Company Settings' }] : []),
    ...(roles.includes('super_admin') ? [{ to: '/dashboard/platform', label: 'Platform' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 flex-col border-r border-border bg-panel px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-700 font-display text-white">H</span>
          <span className="font-display text-lg font-semibold">HR SaaS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-navy-50 text-navy-700' : 'text-ink/70 hover:bg-navy-50/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-auto rounded-card px-3 py-2 text-left text-sm font-medium text-ink/60 hover:bg-navy-50/60">
          Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-panel px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40">
              {user?.roles?.[0]?.replace('_', ' ') || 'Account'}
            </p>
            <p className="font-display text-base font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
            </p>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
