import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as attendanceService from '../../services/attendanceService';
import * as orgService from '../../services/orgService';
import { formatMinutes, formatTime } from '../../utils/time';

const TABS = [
  { key: 'all', label: 'All records' },
  { key: 'late', label: 'Late today' },
  { key: 'absent', label: 'Absent today' },
];

export default function Attendance() {
  const [tab, setTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({ departmentId: '', dateFrom: '', dateTo: '', status: '', page: 1 });

  async function loadStats() {
    try {
      setStats(await attendanceService.getDashboardStats());
    } catch { /* stats are supplementary; ignore individual failure */ }
  }

  async function loadRecords(currentTab = tab, currentFilters = filters) {
    setIsLoading(true);
    setError('');
    try {
      if (currentTab === 'late') {
        setRecords(await attendanceService.listLate());
        setPagination({ total: 0, page: 1, pageSize: 0 });
      } else if (currentTab === 'absent') {
        setRecords(await attendanceService.listAbsent());
        setPagination({ total: 0, page: 1, pageSize: 0 });
      } else {
        const result = await attendanceService.listCompanyAttendance(currentFilters);
        setRecords(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attendance.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(() => {});
    loadStats();
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(nextTab) {
    setTab(nextTab);
    loadRecords(nextTab, filters);
  }

  function updateFilter(patch) {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    setFilters(next);
    loadRecords('all', next);
  }

  const totalPages = pagination.pageSize ? Math.max(Math.ceil(pagination.total / pagination.pageSize), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Attendance</h1>
        <p className="mt-1 text-sm text-ink/60">Company-wide attendance, today's snapshot, and history.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Present today" value={stats.present} />
          <StatCard label="Late today" value={stats.late} />
          <StatCard label="Absent today" value={stats.absent} />
          <StatCard label="On leave" value={stats.onLeave} />
          <StatCard label="Avg hours" value={formatMinutes(stats.averageWorkingMinutes)} />
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-b-2 border-navy-700 text-navy-700' : 'text-ink/50 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <Select value={filters.departmentId} onChange={(e) => updateFilter({ departmentId: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input type="date" value={filters.dateFrom} onChange={(e) => updateFilter({ dateFrom: e.target.value })} placeholder="From" />
          <Input type="date" value={filters.dateTo} onChange={(e) => updateFilter({ dateTo: e.target.value })} placeholder="To" />
          <Select value={filters.status} onChange={(e) => updateFilter({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="on_leave">On leave</option>
            <option value="half_day">Half day</option>
          </Select>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              {tab === 'all' && <th className="px-4 py-3">Date</th>}
              {tab !== 'absent' && <th className="px-4 py-3">Clock in</th>}
              {tab === 'all' && <th className="px-4 py-3">Clock out</th>}
              {tab === 'all' && <th className="px-4 py-3">Hours</th>}
              {tab !== 'absent' && <th className="px-4 py-3">Status</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">Nothing to show here.</td></tr>
            )}
            {records.map((rec) => (
              <tr key={rec.id || rec.employee_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{rec.first_name} {rec.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{rec.department_name || '—'}</td>
                {tab === 'all' && <td className="px-4 py-3 text-ink/70">{rec.work_date}</td>}
                {tab !== 'absent' && <td className="px-4 py-3 text-ink/70">{formatTime(rec.clock_in_at)}</td>}
                {tab === 'all' && <td className="px-4 py-3 text-ink/70">{formatTime(rec.clock_out_at)}</td>}
                {tab === 'all' && <td className="px-4 py-3 text-ink/70">{formatMinutes(rec.total_minutes)}</td>}
                {tab !== 'absent' && <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>}
              </tr>
            ))}
          </tbody>
        </table>

        {tab === 'all' && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink/60">
            <span>Page {pagination.page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => updateFilter({ page: pagination.page - 1 })} className="rounded-card border border-border px-3 py-1 disabled:opacity-40">Previous</button>
              <button disabled={pagination.page >= totalPages} onClick={() => updateFilter({ page: pagination.page + 1 })} className="rounded-card border border-border px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-navy-900">{value ?? 0}</p>
    </div>
  );
}
