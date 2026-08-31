import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import * as recruitmentService from '../../services/recruitmentService';
import * as orgService from '../../services/orgService';

const TABS = [
  { key: 'jobs', label: 'Job postings' },
  { key: 'applications', label: 'Applications' },
];

const PIPELINE_STATUSES = ['applied', 'screening', 'interview', 'shortlisted', 'hired', 'rejected'];

export default function Recruitment() {
  const [tab, setTab] = useState('jobs');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', location: '', employmentType: 'full_time', departmentId: '' });

  const [applications, setApplications] = useState([]);
  const [appFilters, setAppFilters] = useState({ jobPostingId: '', status: '' });
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [notesDraft, setNotesDraft] = useState('');
  const [interviewForm, setInterviewForm] = useState({ scheduledAt: '', method: '', notes: '' });

  async function loadJobs() {
    setIsLoading(true);
    try {
      const result = await recruitmentService.listJobPostings();
      setJobs(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load job postings.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadApplications(filters = appFilters) {
    setIsLoading(true);
    try {
      const result = await recruitmentService.listApplications(filters);
      setApplications(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load applications.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    orgService.listDepartments().then(setDepartments).catch(() => {});
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(next) {
    setTab(next);
    setError('');
    if (next === 'jobs') loadJobs();
    if (next === 'applications') loadApplications();
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    try {
      await recruitmentService.createJobPosting(jobForm);
      setIsJobModalOpen(false);
      setJobForm({ title: '', description: '', requirements: '', location: '', employmentType: 'full_time', departmentId: '' });
      loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create this job posting.');
    }
  }

  async function handlePublish(job) {
    try {
      await recruitmentService.publishJobPosting(job.id);
      loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to publish this posting.');
    }
  }

  async function handleClose(job) {
    if (!confirm(`Close "${job.title}"? It will no longer accept applications.`)) return;
    try {
      await recruitmentService.closeJobPosting(job.id);
      loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to close this posting.');
    }
  }

  function copyPublicLink(job) {
    const url = `${window.location.origin}/careers/COMPANY_SLUG/${job.slug}`;
    navigator.clipboard?.writeText(url);
    setMessage('Public link copied (replace COMPANY_SLUG with your company slug).');
  }

  function updateAppFilter(patch) {
    const next = { ...appFilters, ...patch };
    setAppFilters(next);
    loadApplications(next);
  }

  async function openApplication(app) {
    setSelectedApp(app);
    setNotesDraft(app.internal_notes || '');
    try {
      setInterviews(await recruitmentService.listInterviews(app.id));
    } catch {
      setInterviews([]);
    }
  }

  async function handleStatusChange(status) {
    try {
      const updated = await recruitmentService.setApplicationStatus(selectedApp.id, status);
      setSelectedApp(updated);
      loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
    }
  }

  async function saveNotes() {
    try {
      const updated = await recruitmentService.updateApplicationNotes(selectedApp.id, notesDraft);
      setSelectedApp(updated);
      setMessage('Notes saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save notes.');
    }
  }

  async function submitInterview(e) {
    e.preventDefault();
    try {
      await recruitmentService.scheduleInterview(selectedApp.id, interviewForm);
      setInterviewForm({ scheduledAt: '', method: '', notes: '' });
      setInterviews(await recruitmentService.listInterviews(selectedApp.id));
      loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to schedule this interview.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Recruitment</h1>
        <p className="mt-1 text-sm text-ink/60">Post jobs, review applicants, and schedule interviews.</p>
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

      {tab === 'jobs' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setIsJobModalOpen(true)}>New job posting</Button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Applications</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {!isLoading && jobs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No job postings yet.</td></tr>
                )}
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-ink/70">{job.application_count}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {job.status === 'draft' && (
                        <button onClick={() => handlePublish(job)} className="text-xs font-medium text-success hover:underline">Publish</button>
                      )}
                      {job.status === 'published' && (
                        <>
                          <button onClick={() => copyPublicLink(job)} className="text-xs font-medium text-navy-700 hover:underline">Copy link</button>
                          <button onClick={() => handleClose(job)} className="text-xs font-medium text-danger hover:underline">Close</button>
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

      {tab === 'applications' && (
        <>
          <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            <Select value={appFilters.jobPostingId} onChange={(e) => updateAppFilter({ jobPostingId: e.target.value })}>
              <option value="">All jobs</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </Select>
            <Select value={appFilters.status} onChange={(e) => updateAppFilter({ status: e.target.value })}>
              <option value="">All statuses</option>
              {PIPELINE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
                {!isLoading && applications.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">No applications match these filters.</td></tr>
                )}
                {applications.map((app) => (
                  <tr key={app.id} onClick={() => openApplication(app)} className="cursor-pointer border-b border-border last:border-0 hover:bg-navy-50/30">
                    <td className="px-4 py-3 font-medium">{app.applicant_first_name} {app.applicant_last_name}</td>
                    <td className="px-4 py-3 text-ink/70">{app.job_title}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="New job posting">
        <form onSubmit={handleCreateJob} className="space-y-4">
          <Input label="Title" value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Employment type" value={jobForm.employmentType} onChange={(e) => setJobForm((f) => ({ ...f, employmentType: e.target.value }))}>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
            <Select label="Department (optional)" value={jobForm.departmentId} onChange={(e) => setJobForm((f) => ({ ...f, departmentId: e.target.value }))}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <Input label="Location (optional)" value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} />
          <div>
            <label className="field-label">Description</label>
            <textarea className="field-input min-h-[100px]" value={jobForm.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Requirements</label>
            <textarea className="field-input min-h-[100px]" value={jobForm.requirements} onChange={(e) => setJobForm((f) => ({ ...f, requirements: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full">Create posting (draft)</Button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Applicant">
        {selectedApp && (
          <div className="space-y-5">
            <div>
              <p className="font-display text-lg font-semibold">{selectedApp.applicant_first_name} {selectedApp.applicant_last_name}</p>
              <p className="text-sm text-ink/60">{selectedApp.applicant_email} {selectedApp.applicant_phone ? `· ${selectedApp.applicant_phone}` : ''}</p>
              {selectedApp.resume_url && (
                <a href={selectedApp.resume_url} target="_blank" rel="noreferrer" className="text-sm text-navy-700 hover:underline">
                  View resume
                </a>
              )}
            </div>

            <div>
              <p className="field-label">Pipeline stage</p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
                      selectedApp.status === s ? 'border-navy-700 bg-navy-700 text-white' : 'border-border bg-panel text-ink/70 hover:bg-navy-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Internal notes</label>
              <textarea className="field-input min-h-[80px]" value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} />
              <Button onClick={saveNotes} variant="secondary" className="mt-2">Save notes</Button>
            </div>

            <div>
              <p className="field-label">Interviews</p>
              <ul className="space-y-2 text-sm">
                {interviews.length === 0 && <li className="text-ink/40">No interviews scheduled yet.</li>}
                {interviews.map((iv) => (
                  <li key={iv.id} className="rounded-card border border-border px-3 py-2">
                    <p className="font-medium">{new Date(iv.scheduled_at).toLocaleString()}</p>
                    <p className="text-xs text-ink/50">{iv.method || 'Method not specified'} · {iv.status}</p>
                    {iv.notes && <p className="mt-1 text-xs text-ink/70">{iv.notes}</p>}
                  </li>
                ))}
              </ul>
              <form onSubmit={submitInterview} className="mt-3 space-y-3">
                <Input
                  label="Schedule new interview"
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Method (e.g. video call, onsite)"
                  value={interviewForm.method}
                  onChange={(e) => setInterviewForm((f) => ({ ...f, method: e.target.value }))}
                />
                <Button type="submit" variant="secondary" className="w-full">Schedule interview</Button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
