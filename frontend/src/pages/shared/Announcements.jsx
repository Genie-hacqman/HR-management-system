import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { useAuth } from '../../hooks/useAuth';
import * as announcementService from '../../services/announcementService';

export default function Announcements() {
  const { user } = useAuth();
  const canManage = user?.roles?.includes('company_admin');

  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', attachmentUrl: '' });

  async function load() {
    setIsLoading(true);
    try {
      setAnnouncements(await announcementService.listAnnouncements());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', description: '', attachmentUrl: '' });
    setIsModalOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ title: a.title, description: a.description, attachmentUrl: a.attachment_url || '' });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await announcementService.updateAnnouncement(editing.id, {
          title: form.title, description: form.description, attachment_url: form.attachmentUrl,
        });
      } else {
        await announcementService.createAnnouncement(form);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this announcement.');
    }
  }

  async function handleDelete(a) {
    if (!confirm(`Remove "${a.title}"?`)) return;
    try {
      await announcementService.deleteAnnouncement(a.id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this announcement.');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Announcements</h1>
          <p className="mt-1 text-sm text-ink/60">Company news, policy changes, and events.</p>
        </div>
        {canManage && <Button onClick={openCreate}>New announcement</Button>}
      </div>

      <Alert variant="error">{error}</Alert>

      {isLoading && <p className="text-sm text-ink/40">Loading…</p>}
      {!isLoading && announcements.length === 0 && (
        <p className="text-sm text-ink/40">No announcements yet.</p>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">{a.title}</h2>
                <p className="mt-1 text-xs text-ink/50">
                  {new Date(a.published_at).toLocaleDateString()}
                  {a.author_first_name && ` · ${a.author_first_name} ${a.author_last_name}`}
                </p>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className="text-xs font-medium text-navy-700 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(a)} className="text-xs font-medium text-danger hover:underline">Delete</button>
                </div>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{a.description}</p>
            {a.attachment_url && (
              <a href={a.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-navy-700 hover:underline">
                View attachment
              </a>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit announcement' : 'New announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <div>
            <label className="field-label">Description</label>
            <textarea className="field-input min-h-[120px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <Input
            label="Attachment URL (optional)"
            value={form.attachmentUrl}
            onChange={(e) => setForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
          />
          <Button type="submit" className="w-full">{editing ? 'Save changes' : 'Publish announcement'}</Button>
        </form>
      </Modal>
    </div>
  );
}
