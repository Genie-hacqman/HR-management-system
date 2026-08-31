import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as employeeService from '../../services/employeeService';
import * as orgService from '../../services/orgService';

const STATUS_OPTIONS = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date added' },
  { value: 'name', label: 'Name' },
  { value: 'employee_code', label: 'Employee ID' },
  { value: 'department', label: 'Department' },
  { value: 'employment_date', label: 'Employment date' },
];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '', departmentId: '', status: '', sortBy: 'created_at', sortDir: 'desc', page: 1,
  });

  async function load(currentFilters = filters) {
    setIsLoading(true);
    try {
      const result = await employeeService.listEmployees(currentFilters);
      setEmployees(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load employees.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(patch) {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    setFilters(next);
    load(next);
  }

  const totalPages = Math.max(Math.ceil(pagination.total / pagination.pageSize), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Employees</h1>
          <p className="mt-1 text-sm text-ink/60">{pagination.total} people in your company.</p>
        </div>
        <Link to="/dashboard/employees/new">
          <Button>Add employee</Button>
        </Link>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          className="lg:col-span-2"
          placeholder="Search name, email, or ID"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && updateFilter({ search: filters.search })}
        />
        <Select value={filters.departmentId} onChange={(e) => updateFilter({ departmentId: e.target.value })}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => updateFilter({ status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </Select>
        <Select value={filters.sortBy} onChange={(e) => updateFilter({ sortBy: e.target.value })}>
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </Select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading employees…</td></tr>}
            {!isLoading && employees.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No employees match these filters.</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-navy-50/30">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/employees/${emp.id}`} className="font-medium text-navy-700 hover:underline">
                    {emp.first_name} {emp.last_name}
                  </Link>
                  <p className="text-xs text-ink/50">{emp.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{emp.employee_code}</td>
                <td className="px-4 py-3 text-ink/70">{emp.department_name || '—'}</td>
                <td className="px-4 py-3 text-ink/70">{emp.position_title || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={emp.employment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink/60">
            <span>Page {pagination.page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateFilter({ page: pagination.page - 1 })}
                className="rounded-card border border-border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= totalPages}
                onClick={() => updateFilter({ page: pagination.page + 1 })}
                className="rounded-card border border-border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
