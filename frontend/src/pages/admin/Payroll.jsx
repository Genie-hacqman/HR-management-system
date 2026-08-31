import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import * as payrollService from '../../services/payrollService';

function formatMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_STEPS = ['draft', 'calculated', 'reviewed', 'approved', 'processed'];

export default function Payroll() {
  const [periods, setPeriods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', payDate: '', notes: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ allowances: 0, bonuses: 0, deductions: 0, tax: 0 });

  async function loadPeriods() {
    setIsLoading(true);
    try {
      const result = await payrollService.listPeriods();
      setPeriods(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payroll periods.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadPeriods(); }, []);

  async function openPeriod(id) {
    setError('');
    try {
      setSelected(await payrollService.getPeriod(id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this payroll period.');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const payroll = await payrollService.createPeriod(form);
      setIsCreateOpen(false);
      setForm({ periodStart: '', periodEnd: '', payDate: '', notes: '' });
      loadPeriods();
      openPeriod(payroll.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create this payroll period.');
    }
  }

  async function runAction(action, id) {
    setIsActionLoading(true);
    setError('');
    try {
      await action(id);
      await openPeriod(id);
      loadPeriods();
      setMessage('Payroll updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete this action.');
    } finally {
      setIsActionLoading(false);
    }
  }

  function openEditItem(item) {
    setEditingItem(item);
    setItemForm({
      allowances: item.allowances, bonuses: item.bonuses, deductions: item.deductions, tax: item.tax,
    });
  }

  async function saveItem(e) {
    e.preventDefault();
    try {
      await payrollService.updateItem(selected.payroll.id, editingItem.id, itemForm);
      setEditingItem(null);
      openPeriod(selected.payroll.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this line item.');
    }
  }

  if (selected) {
    const { payroll, items } = selected;
    const totalNet = items.reduce((sum, i) => sum + Number(i.net_salary), 0);
    const stepIndex = STATUS_STEPS.indexOf(payroll.status);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm font-medium text-navy-700 hover:underline">
          ← Back to payroll periods
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">{payroll.period_start} → {payroll.period_end}</h1>
            <p className="mt-1 text-sm text-ink/60">Pay date: {payroll.pay_date} · {items.length} employees · Total net {formatMoney(totalNet)}</p>
          </div>
          <StatusBadge status={payroll.status} />
        </div>

        <Alert variant="error">{error}</Alert>
        <Alert variant="success">{message}</Alert>

        <div className="card flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-ink/50">
            Step {Math.max(stepIndex, 0) + 1} of {STATUS_STEPS.length}
          </span>
          {payroll.status === 'draft' && (
            <Button isLoading={isActionLoading} onClick={() => runAction(payrollService.calculatePeriod, payroll.id)}>
              Calculate payroll
            </Button>
          )}
          {payroll.status === 'calculated' && (
            <Button isLoading={isActionLoading} onClick={() => runAction(payrollService.markReviewed, payroll.id)}>
              Mark as reviewed
            </Button>
          )}
          {payroll.status === 'reviewed' && (
            <Button isLoading={isActionLoading} onClick={() => runAction(payrollService.approvePeriod, payroll.id)}>
              Approve payroll
            </Button>
          )}
          {payroll.status === 'approved' && (
            <Button isLoading={isActionLoading} onClick={() => runAction(payrollService.processPeriod, payroll.id)}>
              Process payroll &amp; generate payslips
            </Button>
          )}
          {payroll.status === 'processed' && (
            <span className="text-sm text-success">✓ Processed — payslips are available to employees.</span>
          )}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Basic</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Bonuses</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3">Net</th>
                {['calculated', 'reviewed'].includes(payroll.status) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-ink/40">Not calculated yet.</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{item.first_name} {item.last_name}</td>
                  <td className="px-4 py-3 text-ink/70">{formatMoney(item.basic_salary)}</td>
                  <td className="px-4 py-3 text-ink/70">{formatMoney(item.allowances)}</td>
                  <td className="px-4 py-3 text-ink/70">{formatMoney(item.bonuses)}</td>
                  <td className="px-4 py-3 text-ink/70">{formatMoney(item.deductions)}</td>
                  <td className="px-4 py-3 text-ink/70">{formatMoney(item.tax)}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(item.net_salary)}</td>
                  {['calculated', 'reviewed'].includes(payroll.status) && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEditItem(item)} className="text-xs font-medium text-navy-700 hover:underline">Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit payroll item">
          {editingItem && (
            <form onSubmit={saveItem} className="space-y-4">
              <p className="text-sm text-ink/60">{editingItem.first_name} {editingItem.last_name}</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Allowances" type="number" min="0" step="0.01" value={itemForm.allowances} onChange={(e) => setItemForm((f) => ({ ...f, allowances: e.target.value }))} />
                <Input label="Bonuses" type="number" min="0" step="0.01" value={itemForm.bonuses} onChange={(e) => setItemForm((f) => ({ ...f, bonuses: e.target.value }))} />
                <Input label="Deductions" type="number" min="0" step="0.01" value={itemForm.deductions} onChange={(e) => setItemForm((f) => ({ ...f, deductions: e.target.value }))} />
                <Input label="Tax" type="number" min="0" step="0.01" value={itemForm.tax} onChange={(e) => setItemForm((f) => ({ ...f, tax: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full">Save changes</Button>
            </form>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Payroll</h1>
          <p className="mt-1 text-sm text-ink/60">Create, calculate, review, approve, and process payroll periods.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>New payroll period</Button>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Pay date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && periods.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">No payroll periods yet.</td></tr>
            )}
            {periods.map((p) => (
              <tr key={p.id} onClick={() => openPeriod(p.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-navy-50/30">
                <td className="px-4 py-3 font-medium">{p.period_start} → {p.period_end}</td>
                <td className="px-4 py-3 text-ink/70">{p.pay_date}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New payroll period">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Period start" type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} required />
            <Input label="Period end" type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} required />
          </div>
          <Input label="Pay date" type="date" value={form.payDate} onChange={(e) => setForm((f) => ({ ...f, payDate: e.target.value }))} required />
          <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" className="w-full">Create period</Button>
        </form>
      </Modal>
    </div>
  );
}
