import { useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import * as documentService from '../../services/documentService';

const TYPE_LABELS = {
  employment_contract: 'Employment contract',
  identification: 'Identification',
  certificate: 'Certificate',
  payslip: 'Payslip',
  hr_letter: 'HR letter',
  company_policy: 'Company policy',
  other: 'Other',
};

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    documentService.getMyDocuments()
      .then(setDocuments)
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your documents.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDownload(doc) {
    try {
      await documentService.downloadDocument(doc.id, doc.original_filename);
    } catch {
      setError('Unable to download this document.');
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My documents</h1>
        <p className="mt-1 text-sm text-ink/60">Documents your HR team has shared with you.</p>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">Loading…</td></tr>}
            {!isLoading && documents.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No documents yet.</td></tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{doc.title}</td>
                <td className="px-4 py-3 text-ink/70">{TYPE_LABELS[doc.document_type] || doc.document_type}</td>
                <td className="px-4 py-3 text-ink/70">{new Date(doc.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDownload(doc)} className="text-xs font-medium text-navy-700 hover:underline">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
