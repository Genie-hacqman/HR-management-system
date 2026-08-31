import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as recruitmentService from '../../services/recruitmentService';

export default function CareersList() {
  const { companySlug } = useParams();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    recruitmentService.listPublicJobs(companySlug)
      .then(setJobs)
      .catch(() => setError('This careers page is not available right now.'))
      .finally(() => setIsLoading(false));
  }, [companySlug]);

  return (
    <div className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Careers</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Open positions</h1>
        <p className="mt-2 text-sm text-ink/60">Find your next role and apply — no account required.</p>

        <div className="mt-10 space-y-4">
          {isLoading && <p className="text-sm text-ink/50">Loading open roles…</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          {!isLoading && !error && jobs.length === 0 && (
            <p className="text-sm text-ink/50">There are no open positions right now. Please check back soon.</p>
          )}
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/careers/${companySlug}/${job.slug}`}
              className="card block p-5 transition-shadow hover:shadow-md"
            >
              <h2 className="font-display text-lg font-semibold text-ink">{job.title}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {job.location || 'Location flexible'} · {job.employment_type.replace('_', ' ')}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
