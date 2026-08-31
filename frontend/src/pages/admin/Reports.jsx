import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import * as reportService from '../../services/reportService';
import * as orgService from '../../services/orgService';
import * as payrollService from '../../services/payrollService';

const REPORT_TABS = [
  { key: 'employees', label: 'Employees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'recruitment', label: 'Recruitment' },
  { key: 'performance', label: 'Performance' },
];

export default function Reports() {
  const [tab, setTab] = useState('employees');
  const [departments, setDepartments] = useState([]);
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [filters, setFilters] = useState({ departmentId: '', status: '', dateFrom: '', dateTo: '', payrollId: '' });
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(() => {});
    payrollService.listPeriods().then((r) => setPayrollPeriods(r.data)).catch(() => {});
  }, []);

  async function runReport(currentTab = tab, currentFilters = filters) {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (currentFilters.departmentId) params.departmentId = currentFilters.departmentId;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.dateFrom) params.dateFrom = currentFilters.dateFrom;
      if (currentFilters.dateTo) params.dateTo = currentFilters.dateTo;
      if (currentTab === 'payroll') params.payrollId = currentFilters.payrollId;
      const result = await reportService.getReport(currentTab, params);
      setReport(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate this report.');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  function switchTab(next) {
    setTab(next);
    setReport(null);
    setError('');
  }

  function updateFilter(patch) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  async function handleDownload() {
    try {
      const params = {};
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (tab === 'payroll') params.payrollId = filters.payrollId;
      await reportService.downloadReport(tab, params);
    } catch {
      setError('Unable to download this report.');
    }
  }

  const columns = report?.rows?.length ? Object.keys(report.rows[0]).filter((k) => !k.startsWith('_')) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-ink/60">Generate and export reports across every module.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="flex gap-2 border-b border-border">
        {REPORT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-b-2 border-navy-700 text-navy-700' : 'text-ink/50 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        {['employees', 'attendance', 'leave'].includes(tab) && (
          <Select value={filters.departmentId} onChange={(e) => updateFilter({ departmentId: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        )}
        {['attendance', 'leave'].includes(tab) && (
          <>
            <Input type="date" value={filters.dateFrom} onChange={(e) => updateFilter({ dateFrom: e.target.value })} placeholder="From" />
            <Input type="date" value={filters.dateTo} onChange={(e) => updateFilter({ dateTo: e.target.value })} placeholder="To" />
          </>
        )}
        {tab === 'payroll' && (
          <Select value={filters.payrollId} onChange={(e) => updateFilter({ payrollId: e.target.value })}>
            <option value="">Select a payroll period</option>
            {payrollPeriods.map((p) => <option key={p.id} value={p.id}>{p.period_start} → {p.period_end}</option>)}
          </Select>
        )}
        <div className="flex gap-2">
          <Button onClick={() => runReport()} isLoading={isLoading}>Generate</Button>
          {report && <Button variant="secondary" onClick={handleDownload}>Download CSV</Button>}
        </div>
      </div>

      {report?.summary && (
        <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          {Object.entries(report.summary).filter(([k]) => typeof report.summary[k] !== 'object').map(([k, v]) => (
            <div key={k}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-1 font-display text-lg font-semibold">{typeof v === 'number' ? v.toLocaleString() : String(v)}</p>
            </div>
          ))}
        </div>
      )}

      {report && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
              <tr>
                {columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3">{c.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 && (
                <tr><td colSpan={columns.length || 1} className="px-4 py-8 text-center text-ink/40">No data for these filters.</td></tr>
              )}
              {report.rows.map((row, i) => (
                <tr key={row.id || i} className="border-b border-border last:border-0">
                  {columns.map((c) => <td key={c} className="whitespace-nowrap px-4 py-3 text-ink/70">{String(row[c] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
