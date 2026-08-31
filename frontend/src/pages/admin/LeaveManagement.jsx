import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import * as leaveService from '../../services/leaveService';
import * as orgService from '../../services/orgService';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'types', label: 'Leave types' },
];

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function LeaveManagement() {
  const [tab, setTab] = useState('requests');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', departmentId: '' });
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const [calendarRange, setCalendarRange] = useState({ dateFrom: startOfMonthISO(), dateTo: endOfMonthISO() });
  const [calendarEntries, setCalendarEntries] = useState([]);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', defaultDaysPerYear: 0, isPaid: true, requiresDocument: false });

  const [isLoading, setIsLoading] = useState(true);

  async function loadRequests(currentFilters = filters) {
    setIsLoading(true);
    try {
      const result = await leaveService.listCompanyRequests(currentFilters);
      setRequests(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCalendar(range = calendarRange) {
    setIsLoading(true);
    try {
      setCalendarEntries(await leaveService.getCalendar(range));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load the leave calendar.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTypes() {
    setIsLoading(true);
    try {
      setLeaveTypes(await leaveService.listLeaveTypes());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load leave types.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(() => {});
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(next) {
    setTab(next);
    setError('');
    if (next === 'requests') loadRequests();
    if (next === 'calendar') loadCalendar();
    if (next === 'types') loadTypes();
  }

  function updateFilter(patch) {
    const next = { ...filters, ...patch };
    setFilters(next);
    loadRequests(next);
  }

  async function handleApprove(request) {
    try {
      await leaveService.approveRequest(request.id);
      setMessage(`Approved ${request.first_name}'s request.`);
      loadRequests();
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
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reject this request.');
    }
  }

  function openCreateType() {
    setEditingType(null);
    setTypeForm({ name: '', defaultDaysPerYear: 0, isPaid: true, requiresDocument: false });
    setIsTypeModalOpen(true);
  }

  function openEditType(type) {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      defaultDaysPerYear: type.default_days_per_year,
      isPaid: !!type.is_paid,
      requiresDocument: !!type.requires_document,
    });
    setIsTypeModalOpen(true);
  }

  async function submitType(e) {
    e.preventDefault();
    try {
      if (editingType) {
        await leaveService.updateLeaveType(editingType.id, {
          name: typeForm.name,
          default_days_per_year: typeForm.defaultDaysPerYear,
          is_paid: typeForm.isPaid,
          requires_document: typeForm.requiresDocument,
        });
      } else {
        await leaveService.createLeaveType(typeForm);
      }
      setIsTypeModalOpen(false);
      loadTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this leave type.');
    }
  }

  async function archiveType(type) {
    if (!confirm(`Archive "${type.name}"?`)) return;
    try {
      await leaveService.archiveLeaveType(type.id);
      loadTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to archive this leave type.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Leave management</h1>
        <p className="mt-1 text-sm text-ink/60">Review requests, see who's out, and configure leave types.</p>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-b-2 border-navy-700 text-navy-700' : 'text-ink/50 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            <Select value={filters.status} onChange={(e) => updateFilter({ status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select value={filters.departmentId} onChange={(e) => updateFilter({ departmentId: e.target.value })}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>

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
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No leave requests match these filters.</td></tr>
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
        </>
      )}

      {tab === 'calendar' && (
        <>
          <div className="card grid grid-cols-2 gap-4 p-4">
            <Input
              type="date"
              label="From"
              value={calendarRange.dateFrom}
              onChange={(e) => { const next = { ...calendarRange, dateFrom: e.target.value }; setCalendarRange(next); loadCalendar(next); }}
            />
            <Input
              type="date"
              label="To"
              value={calendarRange.dateTo}
              onChange={(e) => { const next = { ...calendarRange, dateTo: e.target.value }; setCalendarRange(next); loadCalendar(next); }}
            />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Department</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {!isLoading && calendarEntries.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No approved leave in this range.</td></tr>
                )}
                {calendarEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{entry.first_name} {entry.last_name}</td>
                    <td className="px-4 py-3 text-ink/70">{entry.leave_type_name}</td>
                    <td className="px-4 py-3 text-ink/70">{entry.start_date} → {entry.end_date}</td>
                    <td className="px-4 py-3 text-ink/70">{entry.department_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'types' && (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreateType}>Add leave type</Button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Days/year</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Requires document</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {leaveTypes.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-ink/70">{t.default_days_per_year}</td>
                    <td className="px-4 py-3 text-ink/70">{t.is_paid ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-ink/70">{t.requires_document ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEditType(t)} className="text-xs font-medium text-navy-700 hover:underline">Edit</button>
                      <button onClick={() => archiveType(t)} className="text-xs font-medium text-danger hover:underline">Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject leave request">
        <form onSubmit={submitRejection} className="space-y-4">
          <p className="text-sm text-ink/60">
            {rejecting && `${rejecting.first_name} ${rejecting.last_name} — ${rejecting.leave_type_name}`}
          </p>
          <Input label="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} required />
          <Button type="submit" className="w-full">Reject request</Button>
        </form>
      </Modal>

      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title={editingType ? 'Edit leave type' : 'Add leave type'}>
        <form onSubmit={submitType} className="space-y-4">
          <Input label="Name" value={typeForm.name} onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input
            label="Default days per year"
            type="number"
            min="0"
            step="0.5"
            value={typeForm.defaultDaysPerYear}
            onChange={(e) => setTypeForm((f) => ({ ...f, defaultDaysPerYear: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={typeForm.isPaid} onChange={(e) => setTypeForm((f) => ({ ...f, isPaid: e.target.checked }))} />
            Paid leave
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={typeForm.requiresDocument} onChange={(e) => setTypeForm((f) => ({ ...f, requiresDocument: e.target.checked }))} />
            Requires supporting document
          </label>
          <Button type="submit" className="w-full">{editingType ? 'Save changes' : 'Create leave type'}</Button>
        </form>
      </Modal>
    </div>
  );
}
