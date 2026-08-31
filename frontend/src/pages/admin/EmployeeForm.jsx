import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import * as employeeService from '../../services/employeeService';
import * as orgService from '../../services/orgService';

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '',
  departmentId: '', positionId: '', managerId: '',
  employmentType: 'full_time', employmentDate: '', salary: '',
  employmentStatus: 'active',
  bankName: '', bankAccountName: '', bankAccountNumber: '',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadRefData() {
      const [depts, poss, employeeList] = await Promise.all([
        orgService.listDepartments(),
        orgService.listPositions(),
        employeeService.listEmployees({ pageSize: 100 }),
      ]);
      setDepartments(depts);
      setPositions(poss);
      setManagers(employeeList.data);
    }
    loadRefData();

    if (isEdit) {
      employeeService.getEmployee(id).then((emp) => {
        setForm({
          firstName: emp.first_name, lastName: emp.last_name, email: emp.email, phone: emp.phone || '',
          dateOfBirth: emp.date_of_birth || '', gender: emp.gender || '', address: emp.address || '',
          emergencyContactName: emp.emergency_contact_name || '', emergencyContactPhone: emp.emergency_contact_phone || '',
          departmentId: emp.department_id || '', positionId: emp.position_id || '', managerId: emp.manager_id || '',
          employmentType: emp.employment_type, employmentDate: emp.employment_date || '', salary: emp.salary || '',
          employmentStatus: emp.employment_status,
          bankName: emp.bank_name || '', bankAccountName: emp.bank_account_name || '', bankAccountNumber: emp.bank_account_number || '',
        });
        setIsLoading(false);
      }).catch((err) => {
        setError(err.response?.data?.message || 'Unable to load employee.');
        setIsLoading(false);
      });
    }
  }, [id, isEdit]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSaving(true);
    try {
      if (isEdit) {
        await employeeService.updateEmployee(id, {
          first_name: form.firstName, last_name: form.lastName, email: form.email, phone: form.phone,
          date_of_birth: form.dateOfBirth || null, gender: form.gender || null, address: form.address,
          emergency_contact_name: form.emergencyContactName, emergency_contact_phone: form.emergencyContactPhone,
          department_id: form.departmentId || null, position_id: form.positionId || null, manager_id: form.managerId || null,
          employment_type: form.employmentType, employment_date: form.employmentDate || null,
          salary: form.salary || null, employment_status: form.employmentStatus,
          bank_name: form.bankName, bank_account_name: form.bankAccountName, bank_account_number: form.bankAccountNumber,
        });
        navigate(`/dashboard/employees/${id}`);
      } else {
        const employee = await employeeService.createEmployee(form);
        navigate(`/dashboard/employees/${employee.id}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach((fe) => { mapped[fe.field] = fe.message; });
        setFieldErrors(mapped);
      }
      setError(data?.message || 'Unable to save this employee.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading employee…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{isEdit ? 'Edit employee' : 'Add employee'}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {isEdit ? 'Update this employee\'s details.' : 'Add a new person to your company roster.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6 p-6">
        <Alert variant="error">{error}</Alert>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">Personal details</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} error={fieldErrors.firstName} required />
            <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} error={fieldErrors.lastName} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={fieldErrors.email} required />
            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Select label="Gender" name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Prefer not to say</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency contact name" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} />
            <Input label="Emergency contact phone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">Employment</legend>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" name="departmentId" value={form.departmentId} onChange={handleChange}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Position" name="positionId" value={form.positionId} onChange={handleChange}>
              <option value="">No position</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </div>
          <Select label="Manager" name="managerId" value={form.managerId} onChange={handleChange}>
            <option value="">No manager</option>
            {managers.filter((m) => String(m.id) !== id).map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Employment type" name="employmentType" value={form.employmentType} onChange={handleChange}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
            <Input label="Employment date" name="employmentDate" type="date" value={form.employmentDate} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Salary" name="salary" type="number" min="0" step="0.01" value={form.salary} onChange={handleChange} />
            {isEdit && (
              <Select label="Employment status" name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
                {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">Payment details (optional)</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank name" name="bankName" value={form.bankName} onChange={handleChange} />
            <Input label="Account name" name="bankAccountName" value={form.bankAccountName} onChange={handleChange} />
          </div>
          <Input label="Account number" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} />
        </fieldset>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSaving}>{isEdit ? 'Save changes' : 'Add employee'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
