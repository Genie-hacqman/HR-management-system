import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import * as orgService from '../../services/orgService';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      setDepartments(await orgService.listDepartments());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load departments.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setIsModalOpen(true);
  }

  function openEdit(department) {
    setEditing(department);
    setForm({ name: department.name, description: department.description || '' });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      if (editing) {
        await orgService.updateDepartment(editing.id, form);
      } else {
        await orgService.createDepartment(form);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save department.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(department) {
    if (!confirm(`Archive "${department.name}"? Employees keep their history, but the department will no longer be assignable.`)) return;
    try {
      await orgService.deleteDepartment(department.id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to archive department.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Departments</h1>
          <p className="mt-1 text-sm text-ink/60">Organize your company into departments.</p>
        </div>
        <Button onClick={openCreate}>Add department</Button>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading departments…</td></tr>}
            {!isLoading && departments.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No departments yet. Add your first one.</td></tr>
            )}
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{dept.name}</td>
                <td className="px-4 py-3 text-ink/70">
                  {dept.manager_first_name ? `${dept.manager_first_name} ${dept.manager_last_name}` : '—'}
                </td>
                <td className="px-4 py-3 text-ink/70">{dept.employee_count}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(dept)} className="text-xs font-medium text-navy-700 hover:underline">Edit</button>
                  <button onClick={() => handleArchive(dept)} className="text-xs font-medium text-danger hover:underline">Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit department' : 'Add department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Button type="submit" isLoading={isSaving} className="w-full">
            {editing ? 'Save changes' : 'Create department'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
