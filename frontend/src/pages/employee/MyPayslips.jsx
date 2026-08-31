import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import * as payrollService from '../../services/payrollService';

function formatMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  async function load() {
    setIsLoading(true);
    try {
      const [payslipResult, historyResult] = await Promise.all([
        payrollService.getMyPayslips({ pageSize: 20 }),
        payrollService.getMySalaryHistory({ pageSize: 20 }),
      ]);
      setPayslips(payslipResult.data);
      setHistory(historyResult.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your payslips.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My payslips</h1>
        <p className="mt-1 text-sm text-ink/60">View and download your payslips, and see your salary history.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Pay date</th>
              <th className="px-4 py-3">Net pay</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && payslips.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No payslips yet.</td></tr>
            )}
            {payslips.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{p.period_start} → {p.period_end}</td>
                <td className="px-4 py-3 text-ink/70">{p.pay_date}</td>
                <td className="px-4 py-3 text-ink/70">{formatMoney(p.net_salary)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(p)} className="text-xs font-medium text-navy-700 hover:underline">
                    View / download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Salary history</h2>
        <p className="mt-1 text-sm text-ink/60">Every payroll period you've been included in.</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Basic</th>
              <th className="px-4 py-3">Net pay</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No salary history yet.</td></tr>
            )}
            {history.map((h) => (
              <tr key={h.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{h.period_start} → {h.period_end}</td>
                <td className="px-4 py-3 text-ink/70">{formatMoney(h.basic_salary)}</td>
                <td className="px-4 py-3 text-ink/70">{formatMoney(h.net_salary)}</td>
                <td className="px-4 py-3 text-ink/70 capitalize">{h.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Payslip">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-ink/40">Period</p><p>{viewing.period_start} → {viewing.period_end}</p></div>
              <div><p className="text-xs text-ink/40">Pay date</p><p>{viewing.pay_date}</p></div>
              <div><p className="text-xs text-ink/40">Basic salary</p><p>{formatMoney(viewing.basic_salary)}</p></div>
              <div><p className="text-xs text-ink/40">Allowances</p><p>{formatMoney(viewing.allowances)}</p></div>
              <div><p className="text-xs text-ink/40">Bonuses</p><p>{formatMoney(viewing.bonuses)}</p></div>
              <div><p className="text-xs text-ink/40">Deductions</p><p>−{formatMoney(viewing.deductions)}</p></div>
              <div><p className="text-xs text-ink/40">Tax</p><p>−{formatMoney(viewing.tax)}</p></div>
              <div><p className="text-xs text-ink/40 font-semibold">Net pay</p><p className="font-semibold">{formatMoney(viewing.net_salary)}</p></div>
            </div>
            <button onClick={handlePrint} className="btn-secondary w-full">Print / save as PDF</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
