import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import * as auditLogService from '../../services/auditLogService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState('');

  async function load(currentAction = action) {
    setIsLoading(true);
    try {
      setLogs(await auditLogService.listAuditLogs(currentAction ? { action: currentAction } : {}));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit logs</h1>
        <p className="mt-1 text-sm text-ink/60">A trail of important actions taken across your company.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card p-4">
        <Input
          placeholder="Filter by action (e.g. employee.created)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(action)}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No matching activity.</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{log.action.replace(/[._]/g, ' ')}</td>
                <td className="px-4 py-3 text-ink/70">{log.resource} {log.resource_id ? `#${log.resource_id}` : ''}</td>
                <td className="px-4 py-3 text-ink/50">{log.ip_address || '—'}</td>
                <td className="px-4 py-3 text-ink/50">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
