import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as employeeService from '../../services/employeeService';

const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const emp = await employeeService.getEmployee(id);
      setEmployee(emp);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this employee.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function loadHistory() {
    setShowHistory(true);
    try {
      setHistory(await employeeService.getEmployeeHistory(id));
    } catch {
      setHistory([]);
    }
  }

  async function handleStatusChange(e) {
    const status = e.target.value;
    try {
      const updated = await employeeService.setEmployeeStatus(id, status);
      setEmployee(updated);
      setMessage(`Status updated to ${status.replace('_', ' ')}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
    }
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${employee.first_name} ${employee.last_name}? Their record and history are kept.`)) return;
    try {
      await employeeService.deactivateEmployee(id);
      navigate('/dashboard/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to deactivate this employee.');
    }
  }

  if (isLoading) return <p className="text-sm text-ink/60">Loading employee…</p>;
  if (!employee) return <Alert variant="error">{error || 'Employee not found.'}</Alert>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-ink/40">{employee.employee_code}</p>
          <h1 className="font-display text-2xl font-semibold">{employee.first_name} {employee.last_name}</h1>
          <p className="mt-1 text-sm text-ink/60">{employee.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/employees/${id}/edit`}><Button variant="secondary">Edit</Button></Link>
          <Button variant="secondary" onClick={handleDeactivate}>Deactivate</Button>
        </div>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="card grid grid-cols-2 gap-6 p-6">
        <Field label="Status">
          <div className="flex items-center gap-3">
            <StatusBadge status={employee.employment_status} />
            <Select value={employee.employment_status} onChange={handleStatusChange} className="w-40">
              {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
        </Field>
        <Field label="Employment type">{employee.employment_type.replace('_', ' ')}</Field>
        <Field label="Department">{employee.department_name || '—'}</Field>
        <Field label="Position">{employee.position_title || '—'}</Field>
        <Field label="Manager">
          {employee.manager_first_name ? `${employee.manager_first_name} ${employee.manager_last_name}` : '—'}
        </Field>
        <Field label="Employment date">{employee.employment_date || '—'}</Field>
        <Field label="Phone">{employee.phone || '—'}</Field>
        <Field label="Date of birth">{employee.date_of_birth || '—'}</Field>
        <Field label="Salary">{employee.salary ? `$${Number(employee.salary).toLocaleString()}` : '—'}</Field>
        <Field label="Gender">{employee.gender ? employee.gender.replace('_', ' ') : '—'}</Field>
        <Field label="Address" span2>{employee.address || '—'}</Field>
        <Field label="Emergency contact" span2>
          {employee.emergency_contact_name
            ? `${employee.emergency_contact_name} — ${employee.emergency_contact_phone || 'no phone on file'}`
            : '—'}
        </Field>
      </div>

      <div className="card p-6">
        <button onClick={loadHistory} className="text-sm font-medium text-navy-700 hover:underline">
          {showHistory ? 'Refresh history' : 'View change history'}
        </button>
        {showHistory && (
          <ul className="mt-4 space-y-3 text-sm">
            {history.length === 0 && <li className="text-ink/40">No recorded changes yet.</li>}
            {history.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-3 last:border-0">
                <p className="font-medium">{entry.action.replace(/\./g, ' ').replace(/_/g, ' ')}</p>
                <p className="text-xs text-ink/50">{new Date(entry.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, span2 = false }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 text-sm text-ink capitalize">{children}</p>
    </div>
  );
}
