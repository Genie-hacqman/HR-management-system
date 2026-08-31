import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as attendanceService from '../../services/attendanceService';
import { formatMinutes, formatTime } from '../../utils/time';

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function MyAttendance() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const [todayRecord, historyResult, summaryResult] = await Promise.all([
        attendanceService.getMyToday(),
        attendanceService.getMyHistory({ pageSize: 15 }),
        attendanceService.getMySummary({ dateFrom: startOfMonthISO(), dateTo: todayISO() }),
      ]);
      setToday(todayRecord);
      setHistory(historyResult.data);
      setSummary(summaryResult);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your attendance.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleClock(action) {
    setIsClocking(true);
    setError('');
    try {
      if (action === 'in') await attendanceService.clockIn();
      else await attendanceService.clockOut();
      load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to clock ${action}.`);
    } finally {
      setIsClocking(false);
    }
  }

  if (isLoading) return <p className="text-sm text-ink/60">Loading your attendance…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My attendance</h1>
        <p className="mt-1 text-sm text-ink/60">Clock in and out, and track your hours.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card flex items-center justify-between p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Today</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span>Clock in: <strong>{formatTime(today?.clock_in_at)}</strong></span>
            <span>Clock out: <strong>{formatTime(today?.clock_out_at)}</strong></span>
            {today?.status && <StatusBadge status={today.status} />}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleClock('in')} isLoading={isClocking} disabled={!!today?.clock_in_at}>
            Clock in
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleClock('out')}
            isLoading={isClocking}
            disabled={!today?.clock_in_at || !!today?.clock_out_at}
          >
            Clock out
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Hours this month" value={formatMinutes(summary.totalMinutes)} />
          <StatCard label="Days recorded" value={summary.daysRecorded} />
          <StatCard label="Avg hours/day" value={summary.daysRecorded ? formatMinutes(summary.totalMinutes / summary.daysRecorded) : '—'} />
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Clock in</th>
              <th className="px-4 py-3">Clock out</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No attendance recorded yet.</td></tr>
            )}
            {history.map((rec) => (
              <tr key={rec.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{rec.work_date}</td>
                <td className="px-4 py-3 text-ink/70">{formatTime(rec.clock_in_at)}</td>
                <td className="px-4 py-3 text-ink/70">{formatTime(rec.clock_out_at)}</td>
                <td className="px-4 py-3 text-ink/70">{formatMinutes(rec.total_minutes)}</td>
                <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
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
      <p className="mt-1 font-display text-xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}
