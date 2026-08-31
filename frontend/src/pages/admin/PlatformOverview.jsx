import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as platformService from '../../services/platformService';

export default function PlatformOverview() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const [companyList, platformStats] = await Promise.all([
        platformService.listCompanies(),
        platformService.getPlatformStats(),
      ]);
      setCompanies(companyList);
      setStats(platformStats);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load platform data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSuspend(company) {
    const nextStatus = company.status === 'suspended' ? 'active' : 'suspended';
    try {
      await platformService.setCompanyStatus(company.id, nextStatus);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update company status.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform overview</h1>
        <p className="mt-1 text-sm text-ink/60">Every company on the platform, and system-wide statistics.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total companies" value={stats.companies.total_companies} />
          <StatCard label="Active companies" value={stats.companies.active_companies} />
          <StatCard label="Total users" value={stats.users.total_users} />
          <StatCard label="Active users" value={stats.users.active_users} />
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading companies…</td></tr>}
            {!isLoading && companies.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No companies registered yet.</td></tr>
            )}
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{company.name}</td>
                <td className="px-4 py-3 text-ink/70">{company.email}</td>
                <td className="px-4 py-3 text-ink/70">{company.country || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={company.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleSuspend(company)} className="text-xs font-medium text-navy-700 hover:underline">
                    {company.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-navy-900">{value ?? 0}</p>
    </div>
  );
}
