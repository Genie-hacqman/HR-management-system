import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import * as orgService from '../../services/orgService';

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', departmentId: '' });
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const [positionList, departmentList] = await Promise.all([
        orgService.listPositions(),
        orgService.listDepartments(),
      ]);
      setPositions(positionList);
      setDepartments(departmentList);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load positions.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', departmentId: '' });
    setIsModalOpen(true);
  }

  function openEdit(position) {
    setEditing(position);
    setForm({ title: position.title, description: position.description || '', departmentId: position.department_id || '' });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      if (editing) {
        await orgService.updatePosition(editing.id, {
          title: form.title,
          description: form.description,
          department_id: form.departmentId || null,
        });
      } else {
        await orgService.createPosition(form);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save position.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(position) {
    if (!confirm(`Archive "${position.title}"?`)) return;
    try {
      await orgService.deletePosition(position.id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to archive position.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Positions</h1>
          <p className="mt-1 text-sm text-ink/60">Job titles employees can be assigned to.</p>
        </div>
        <Button onClick={openCreate}>Add position</Button>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading positions…</td></tr>}
            {!isLoading && positions.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No positions yet. Add your first one.</td></tr>
            )}
            {positions.map((pos) => (
              <tr key={pos.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{pos.title}</td>
                <td className="px-4 py-3 text-ink/70">{pos.department_name || '—'}</td>
                <td className="px-4 py-3 text-ink/70">{pos.employee_count}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(pos)} className="text-xs font-medium text-navy-700 hover:underline">Edit</button>
                  <button onClick={() => handleArchive(pos)} className="text-xs font-medium text-danger hover:underline">Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit position' : 'Add position'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Position title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Select
            label="Department (optional)"
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
          >
            <option value="">No department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Button type="submit" isLoading={isSaving} className="w-full">
            {editing ? 'Save changes' : 'Create position'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
