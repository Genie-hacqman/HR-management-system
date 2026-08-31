import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import * as documentService from '../../services/documentService';
import * as employeeService from '../../services/employeeService';

const TYPE_OPTIONS = [
  { value: 'employment_contract', label: 'Employment contract' },
  { value: 'identification', label: 'Identification' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'hr_letter', label: 'HR letter' },
  { value: 'company_policy', label: 'Company policy' },
  { value: 'other', label: 'Other' },
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', documentType: 'other', title: '', file: null });
  const [isUploading, setIsUploading] = useState(false);

  async function loadDocuments(employeeId = filterEmployeeId) {
    setIsLoading(true);
    try {
      setDocuments(await documentService.listDocuments(employeeId ? { employeeId } : {}));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load documents.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    employeeService.listEmployees({ pageSize: 200 }).then((result) => setEmployees(result.data)).catch(() => {});
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!form.file) {
      setError('Please choose a file to upload.');
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      await documentService.uploadDocument(form);
      setIsModalOpen(false);
      setForm({ employeeId: '', documentType: 'other', title: '', file: null });
      setMessage('Document uploaded.');
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload this document.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      await documentService.downloadDocument(doc.id, doc.original_filename);
    } catch {
      setError('Unable to download this document.');
    }
  }

  async function handleDelete(doc) {
    if (!confirm(`Remove "${doc.title}"?`)) return;
    try {
      await documentService.deleteDocument(doc.id);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this document.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-sm text-ink/60">Upload and manage employee documents.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Upload document</Button>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="card p-4">
        <Select value={filterEmployeeId} onChange={(e) => { setFilterEmployeeId(e.target.value); loadDocuments(e.target.value); }}>
          <option value="">All employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
        </Select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && documents.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No documents yet.</td></tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{doc.first_name} {doc.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{doc.title}</td>
                <td className="px-4 py-3 text-ink/70">{TYPE_OPTIONS.find((t) => t.value === doc.document_type)?.label || doc.document_type}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleDownload(doc)} className="text-xs font-medium text-navy-700 hover:underline">Download</button>
                  <button onClick={() => handleDelete(doc)} className="text-xs font-medium text-danger hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload document">
        <form onSubmit={handleUpload} className="space-y-4">
          <Select label="Employee" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Select an employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </Select>
          <Select label="Document type" value={form.documentType} onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <div>
            <label className="field-label">File (PDF, JPEG, PNG, DOC, DOCX — max 10MB)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))}
              className="field-input"
              required
            />
          </div>
          <Button type="submit" isLoading={isUploading} className="w-full">Upload</Button>
        </form>
      </Modal>
    </div>
  );
}
