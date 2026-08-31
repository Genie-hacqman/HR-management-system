import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import * as leaveService from '../../services/leaveService';

export default function TeamLeave() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  async function load() {
    setIsLoading(true);
    try {
      setRequests(await leaveService.listTeamRequests());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load team leave requests.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(request) {
    try {
      await leaveService.approveRequest(request.id);
      setMessage(`Approved ${request.first_name}'s request.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to approve this request.');
    }
  }

  async function submitRejection(e) {
    e.preventDefault();
    try {
      await leaveService.rejectRequest(rejecting.id, reason);
      setRejecting(null);
      setReason('');
      setMessage(`Rejected ${rejecting.first_name}'s request.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reject this request.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Team leave requests</h1>
        <p className="mt-1 text-sm text-ink/60">Approve or reject requests from your direct reports.</p>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No leave requests from your team yet.</td></tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{req.first_name} {req.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{req.leave_type_name}</td>
                <td className="px-4 py-3 text-ink/70">{req.start_date} → {req.end_date} ({req.total_days}d)</td>
                <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(req)} className="text-xs font-medium text-success hover:underline">Approve</button>
                      <button onClick={() => setRejecting(req)} className="text-xs font-medium text-danger hover:underline">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject leave request">
        <form onSubmit={submitRejection} className="space-y-4">
          <p className="text-sm text-ink/60">
            {rejecting && `${rejecting.first_name} ${rejecting.last_name} — ${rejecting.leave_type_name}`}
          </p>
          <Input label="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} required />
          <Button type="submit" className="w-full">Reject request</Button>
        </form>
      </Modal>
    </div>
  );
}
