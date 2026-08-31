import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import * as leaveService from '../../services/leaveService';

const emptyForm = { leaveTypeId: '', startDate: '', endDate: '', reason: '', supportingDocumentUrl: '' };

export default function MyLeave() {
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const [balanceList, typeList, requestResult] = await Promise.all([
        leaveService.getMyBalances(),
        leaveService.listLeaveTypes(),
        leaveService.getMyRequests({ pageSize: 20 }),
      ]);
      setBalances(balanceList);
      setLeaveTypes(typeList);
      setRequests(requestResult.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your leave information.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openRequestModal() {
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await leaveService.submitRequest(form);
      setIsModalOpen(false);
      setMessage('Leave request submitted.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to submit this request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(request) {
    if (!confirm('Cancel this pending leave request?')) return;
    try {
      await leaveService.cancelMyRequest(request.id);
      setMessage('Leave request cancelled.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel this request.');
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">My leave</h1>
          <p className="mt-1 text-sm text-ink/60">Check your balance and request time off.</p>
        </div>
        <Button onClick={openRequestModal}>Request leave</Button>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {balances.map((b) => (
          <div key={b.leave_type_name} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{b.leave_type_name}</p>
            <p className="mt-1 font-display text-xl font-semibold text-navy-900">
              {b.is_paid && Number(b.allocated_days) > 0
                ? `${(Number(b.allocated_days) - Number(b.used_days)).toFixed(1)} / ${Number(b.allocated_days).toFixed(0)} days`
                : 'Unlimited'}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No leave requests yet.</td></tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{req.leave_type_name}</td>
                <td className="px-4 py-3 text-ink/70">{req.start_date} → {req.end_date}</td>
                <td className="px-4 py-3 text-ink/70">{req.total_days}</td>
                <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-4 py-3 text-right">
                  {req.status === 'pending' && (
                    <button onClick={() => handleCancel(req)} className="text-xs font-medium text-danger hover:underline">
                      Cancel
                    </button>
                  )}
                  {req.status === 'rejected' && req.reviewer_notes && (
                    <span className="text-xs text-ink/50" title={req.reviewer_notes}>Reason on file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="error">{formError}</Alert>
          <Select
            label="Leave type"
            value={form.leaveTypeId}
            onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
            required
          >
            <option value="">Select a leave type</option>
            {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <Input
            label="Supporting document URL (if required)"
            placeholder="https://…"
            value={form.supportingDocumentUrl}
            onChange={(e) => setForm((f) => ({ ...f, supportingDocumentUrl: e.target.value }))}
          />
          <Button type="submit" isLoading={isSubmitting} className="w-full">Submit request</Button>
        </form>
      </Modal>
    </div>
  );
}
