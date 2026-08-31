import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import * as performanceService from '../../services/performanceService';
import * as employeeService from '../../services/employeeService';

const TABS = [
  { key: 'goals', label: 'Goals' },
  { key: 'reviews', label: 'Reviews' },
];

export default function PerformanceManagement() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('company_admin');

  const [tab, setTab] = useState('goals');
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [goals, setGoals] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ employeeId: '', title: '', kpi: '', targetValue: '', dueDate: '' });

  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ employeeId: '', reviewPeriodStart: '', reviewPeriodEnd: '' });
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ overall_rating: '', strengths: '', areas_for_improvement: '', manager_feedback: '' });

  async function loadEmployees() {
    try {
      if (isAdmin) {
        const result = await employeeService.listEmployees({ pageSize: 200 });
        setEmployees(result.data);
      } else {
        const { reports } = await employeeService.getMyTeam();
        setEmployees(reports);
      }
    } catch {
      setEmployees([]);
    }
  }

  async function loadGoals() {
    setIsLoading(true);
    try {
      setGoals(await performanceService.listGoals());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load goals.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReviews() {
    setIsLoading(true);
    try {
      setReviews(await performanceService.listReviews());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reviews.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(next) {
    setTab(next);
    setError('');
    if (next === 'goals') loadGoals();
    if (next === 'reviews') loadReviews();
  }

  async function handleCreateGoal(e) {
    e.preventDefault();
    try {
      await performanceService.createGoal(goalForm);
      setIsGoalModalOpen(false);
      setGoalForm({ employeeId: '', title: '', kpi: '', targetValue: '', dueDate: '' });
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create this goal.');
    }
  }

  async function updateProgress(goal, progressPercent) {
    try {
      await performanceService.updateGoalProgress(goal.id, { progressPercent });
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update progress.');
    }
  }

  async function handleCreateReview(e) {
    e.preventDefault();
    try {
      await performanceService.createReview(reviewForm);
      setIsReviewModalOpen(false);
      setReviewForm({ employeeId: '', reviewPeriodStart: '', reviewPeriodEnd: '' });
      loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create this review.');
    }
  }

  async function openReview(review) {
    const full = await performanceService.getReview(review.id);
    setSelectedReview(full);
    setReviewDraft({
      overall_rating: full.overall_rating || '',
      strengths: full.strengths || '',
      areas_for_improvement: full.areas_for_improvement || '',
      manager_feedback: full.manager_feedback || '',
    });
  }

  async function saveReviewDraft() {
    try {
      const updated = await performanceService.updateReview(selectedReview.id, reviewDraft);
      setSelectedReview(updated);
      setMessage('Review saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this review.');
    }
  }

  async function transitionReview(action) {
    try {
      const fn = { start: performanceService.startReview, submit: performanceService.submitReview, complete: performanceService.completeReview }[action];
      const updated = await fn(selectedReview.id);
      setSelectedReview(updated);
      loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this review.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Performance</h1>
        <p className="mt-1 text-sm text-ink/60">
          {isAdmin ? 'Goals and reviews across the company.' : 'Goals and reviews for your direct reports.'}
        </p>
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

      {tab === 'goals' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setIsGoalModalOpen(true)}>New goal</Button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Goal</th>
                  <th className="px-4 py-3">KPI</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {!isLoading && goals.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No goals yet.</td></tr>
                )}
                {goals.map((g) => (
                  <tr key={g.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{g.first_name} {g.last_name}</td>
                    <td className="px-4 py-3 text-ink/70">{g.title}</td>
                    <td className="px-4 py-3 text-ink/70">{g.kpi || '—'}</td>
                    <td className="px-4 py-3">
                      <input
                        type="range" min="0" max="100" value={g.progress_percent}
                        onChange={(e) => updateProgress(g, Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="ml-2 text-xs text-ink/60">{g.progress_percent}%</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reviews' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setIsReviewModalOpen(true)}>New review</Button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {!isLoading && reviews.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No reviews yet.</td></tr>
                )}
                {reviews.map((r) => (
                  <tr key={r.id} onClick={() => openReview(r)} className="cursor-pointer border-b border-border last:border-0 hover:bg-navy-50/30">
                    <td className="px-4 py-3 font-medium">{r.first_name} {r.last_name}</td>
                    <td className="px-4 py-3 text-ink/70">{r.review_period_start} → {r.review_period_end}</td>
                    <td className="px-4 py-3 text-ink/70">{r.overall_rating ? `${r.overall_rating} / 5` : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="New goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Select label="Employee" value={goalForm.employeeId} onChange={(e) => setGoalForm((f) => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Select an employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </Select>
          <Input label="Goal title" value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} required />
          <Input label="KPI (measurable target)" placeholder="e.g. Close 10 deals" value={goalForm.kpi} onChange={(e) => setGoalForm((f) => ({ ...f, kpi: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target value" value={goalForm.targetValue} onChange={(e) => setGoalForm((f) => ({ ...f, targetValue: e.target.value }))} />
            <Input label="Due date" type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full">Create goal</Button>
        </form>
      </Modal>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="New performance review">
        <form onSubmit={handleCreateReview} className="space-y-4">
          <Select label="Employee" value={reviewForm.employeeId} onChange={(e) => setReviewForm((f) => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Select an employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Period start" type="date" value={reviewForm.reviewPeriodStart} onChange={(e) => setReviewForm((f) => ({ ...f, reviewPeriodStart: e.target.value }))} required />
            <Input label="Period end" type="date" value={reviewForm.reviewPeriodEnd} onChange={(e) => setReviewForm((f) => ({ ...f, reviewPeriodEnd: e.target.value }))} required />
          </div>
          <Button type="submit" className="w-full">Create review (draft)</Button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Performance review">
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{selectedReview.first_name} {selectedReview.last_name}</p>
              <StatusBadge status={selectedReview.status} />
            </div>

            {['draft', 'in_progress'].includes(selectedReview.status) ? (
              <>
                <Input
                  label="Overall rating (0–5)"
                  type="number" min="0" max="5" step="0.5"
                  value={reviewDraft.overall_rating}
                  onChange={(e) => setReviewDraft((f) => ({ ...f, overall_rating: e.target.value }))}
                />
                <div>
                  <label className="field-label">Strengths</label>
                  <textarea className="field-input min-h-[70px]" value={reviewDraft.strengths} onChange={(e) => setReviewDraft((f) => ({ ...f, strengths: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Areas for improvement</label>
                  <textarea className="field-input min-h-[70px]" value={reviewDraft.areas_for_improvement} onChange={(e) => setReviewDraft((f) => ({ ...f, areas_for_improvement: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Manager feedback</label>
                  <textarea className="field-input min-h-[70px]" value={reviewDraft.manager_feedback} onChange={(e) => setReviewDraft((f) => ({ ...f, manager_feedback: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={saveReviewDraft}>Save draft</Button>
                  {selectedReview.status === 'draft' && <Button onClick={() => transitionReview('start')}>Start review</Button>}
                  {selectedReview.status === 'in_progress' && <Button onClick={() => transitionReview('submit')}>Submit to employee</Button>}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm"><span className="text-ink/40">Rating:</span> {selectedReview.overall_rating} / 5</p>
                {selectedReview.strengths && <p className="text-sm"><span className="text-ink/40">Strengths:</span> {selectedReview.strengths}</p>}
                {selectedReview.areas_for_improvement && <p className="text-sm"><span className="text-ink/40">Areas for improvement:</span> {selectedReview.areas_for_improvement}</p>}
                <p className="text-sm"><span className="text-ink/40">Manager feedback:</span> {selectedReview.manager_feedback}</p>
                {selectedReview.employee_comments && (
                  <p className="text-sm"><span className="text-ink/40">Employee comments:</span> {selectedReview.employee_comments}</p>
                )}
                {selectedReview.status === 'reviewed' && (
                  <Button onClick={() => transitionReview('complete')}>Complete review</Button>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
