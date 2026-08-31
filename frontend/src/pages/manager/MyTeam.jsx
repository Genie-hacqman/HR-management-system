import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as employeeService from '../../services/employeeService';

export default function MyTeam() {
  const [reports, setReports] = useState([]);
  const [manager, setManager] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    employeeService.getMyTeam()
      .then(({ manager, reports }) => {
        setManager(manager);
        setReports(reports);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your team.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My team</h1>
        <p className="mt-1 text-sm text-ink/60">
          {manager ? `${reports.length} direct report${reports.length === 1 ? '' : 's'}.` : ' '}
        </p>
      </div>

      <Alert variant="error">{error}</Alert>

      {!isLoading && !manager && !error && (
        <Alert variant="info">No employee profile is linked to your account yet, so a team can't be shown.</Alert>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">Loading team…</td></tr>}
            {!isLoading && reports.length === 0 && manager && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">No one reports to you yet.</td></tr>
            )}
            {reports.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{emp.first_name} {emp.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{emp.position_title || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={emp.employment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
