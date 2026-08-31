import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import * as employeeService from '../../services/employeeService';

export default function MyProfile() {
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    employeeService.getMyProfile()
      .then((emp) => {
        setEmployee(emp);
        setForm({
          phone: emp.phone || '',
          address: emp.address || '',
          emergency_contact_name: emp.emergency_contact_name || '',
          emergency_contact_phone: emp.emergency_contact_phone || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'No employee profile is linked to your account yet.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const updated = await employeeService.updateMyProfile(form);
      setEmployee(updated);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-ink/60">Loading your profile…</p>;
  if (!employee) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{employee.first_name} {employee.last_name}</h1>
        <p className="mt-1 text-sm text-ink/60">{employee.email} · {employee.employee_code}</p>
        <div className="mt-2"><StatusBadge status={employee.employment_status} /></div>
      </div>

      <div className="card grid grid-cols-2 gap-6 p-6 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Department</p>
          <p className="mt-1">{employee.department_name || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Position</p>
          <p className="mt-1">{employee.position_title || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Manager</p>
          <p className="mt-1">{employee.manager_first_name ? `${employee.manager_first_name} ${employee.manager_last_name}` : '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Employment date</p>
          <p className="mt-1">{employee.employment_date || '—'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Update your contact details</p>
        <Alert variant="error">{error}</Alert>
        <Alert variant="success">{message}</Alert>
        <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emergency contact name"
            value={form.emergency_contact_name}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))}
          />
          <Input
            label="Emergency contact phone"
            value={form.emergency_contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))}
          />
        </div>
        <Button type="submit" isLoading={isSaving}>Save changes</Button>
      </form>
    </div>
  );
}
