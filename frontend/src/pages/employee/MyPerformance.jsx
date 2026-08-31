import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import * as performanceService from '../../services/performanceService';

export default function MyPerformance() {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(null);
  const [comments, setComments] = useState('');

  async function load() {
    setIsLoading(true);
    try {
      const [goalList, reviewList] = await Promise.all([
        performanceService.getMyGoals(),
        performanceService.getMyReviews(),
      ]);
      setGoals(goalList);
      setReviews(reviewList);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your performance information.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAcknowledge(review) {
    setAcknowledging(review);
    setComments(review.employee_comments || '');
  }

  async function submitAcknowledge(e) {
    e.preventDefault();
    try {
      await performanceService.acknowledgeReview(acknowledging.id, comments);
      setAcknowledging(null);
      setMessage('Review acknowledged. Thank you for your feedback.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to acknowledge this review.');
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">My performance</h1>
        <p className="mt-1 text-sm text-ink/60">Track your goals and view your performance reviews.</p>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div>
        <h2 className="font-display text-lg font-semibold">Goals</h2>
        <div className="mt-3 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">KPI</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
              {!isLoading && goals.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No goals assigned yet.</td></tr>
              )}
              {goals.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{g.title}</td>
                  <td className="px-4 py-3 text-ink/70">{g.kpi || '—'}</td>
                  <td className="px-4 py-3 text-ink/70">{g.progress_percent}%</td>
                  <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Performance reviews</h2>
        <div className="mt-3 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && reviews.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No reviews yet.</td></tr>
              )}
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{r.review_period_start} → {r.review_period_end}</td>
                  <td className="px-4 py-3 text-ink/70">{r.overall_rating ? `${r.overall_rating} / 5` : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'submitted' && (
                      <button onClick={() => openAcknowledge(r)} className="text-xs font-medium text-navy-700 hover:underline">
                        Review &amp; acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!acknowledging} onClose={() => setAcknowledging(null)} title="Performance review">
        {acknowledging && (
          <form onSubmit={submitAcknowledge} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-ink/40">Period</p><p>{acknowledging.review_period_start} → {acknowledging.review_period_end}</p></div>
              <div><p className="text-xs text-ink/40">Overall rating</p><p>{acknowledging.overall_rating} / 5</p></div>
            </div>
            {acknowledging.strengths && (
              <div><p className="text-xs text-ink/40">Strengths</p><p className="text-sm">{acknowledging.strengths}</p></div>
            )}
            {acknowledging.areas_for_improvement && (
              <div><p className="text-xs text-ink/40">Areas for improvement</p><p className="text-sm">{acknowledging.areas_for_improvement}</p></div>
            )}
            <div><p className="text-xs text-ink/40">Manager feedback</p><p className="text-sm">{acknowledging.manager_feedback}</p></div>
            <div>
              <label className="field-label">Your comments (optional)</label>
              <textarea className="field-input min-h-[80px]" value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Acknowledge review</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
