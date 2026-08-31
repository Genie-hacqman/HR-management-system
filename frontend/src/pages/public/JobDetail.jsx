import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import * as recruitmentService from '../../services/recruitmentService';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' };

export default function JobDetail() {
  const { companySlug, jobSlug } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    recruitmentService.getPublicJob(companySlug, jobSlug)
      .then(setJob)
      .catch(() => setError('This job posting is no longer available.'))
      .finally(() => setIsLoading(false));
  }, [companySlug, jobSlug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await recruitmentService.submitPublicApplication(companySlug, jobSlug, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-surface px-6 py-16 text-center text-sm text-ink/50">Loading…</div>;
  }
  if (error || !job) {
    return (
      <div className="min-h-screen bg-surface px-6 py-16 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link to={`/careers/${companySlug}`} className="mt-4 inline-block text-sm text-navy-700 hover:underline">
          ← Back to open positions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to={`/careers/${companySlug}`} className="text-sm font-medium text-navy-700 hover:underline">
          ← Back to open positions
        </Link>

        <h1 className="mt-4 font-display text-3xl font-semibold text-ink">{job.title}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {job.location || 'Location flexible'} · {job.employment_type.replace('_', ' ')}
        </p>

        {job.description && (
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink/80">{job.description}</div>
        )}
        {job.requirements && (
          <div className="mt-6">
            <h2 className="font-display text-base font-semibold text-ink">Requirements</h2>
            <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{job.requirements}</div>
          </div>
        )}

        <div className="mt-10 card p-6">
          <h2 className="font-display text-lg font-semibold">Apply for this role</h2>
          {submitted ? (
            <Alert variant="success">
              Thank you for applying! We've received your application and will be in touch.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <Alert variant="error">{submitError}</Alert>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
                <Input label="Last name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
              </div>
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input
                label="Resume URL"
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                value={form.resumeUrl}
                onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
              />
              <div>
                <label className="field-label">Cover letter (optional)</label>
                <textarea
                  className="field-input min-h-[120px]"
                  value={form.coverLetter}
                  onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                />
              </div>
              <Button type="submit" isLoading={isSubmitting} className="w-full">Submit application</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
