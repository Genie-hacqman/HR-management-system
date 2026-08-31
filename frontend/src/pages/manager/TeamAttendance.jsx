import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as attendanceService from '../../services/attendanceService';
import { formatMinutes, formatTime } from '../../utils/time';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeamAttendance() {
  const [date, setDate] = useState(todayISO());
  const [team, setTeam] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function load(forDate = date) {
    setIsLoading(true);
    try {
      setTeam(await attendanceService.getTeamAttendance({ date: forDate }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load team attendance.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Team attendance</h1>
          <p className="mt-1 text-sm text-ink/60">Your direct reports' attendance for the selected day.</p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); load(e.target.value); }}
          className="w-44"
        />
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Clock in</th>
              <th className="px-4 py-3">Clock out</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && team.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No one reports to you yet.</td></tr>
            )}
            {team.map((row) => (
              <tr key={row.employee_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{row.first_name} {row.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{formatTime(row.clock_in_at)}</td>
                <td className="px-4 py-3 text-ink/70">{formatTime(row.clock_out_at)}</td>
                <td className="px-4 py-3 text-ink/70">{formatMinutes(row.total_minutes)}</td>
                <td className="px-4 py-3">{row.status ? <StatusBadge status={row.status} /> : <StatusBadge status="absent" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
