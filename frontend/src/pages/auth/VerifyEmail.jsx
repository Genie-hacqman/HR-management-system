import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Alert from '../../components/ui/Alert';
import * as authService from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    authService
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [searchParams]);

  return (
    <AuthLayout eyebrow="Email verification" title="Verifying your email">
      {status === 'verifying' && <Alert variant="info">Checking your verification link…</Alert>}
      {status === 'success' && <Alert variant="success">Your email is verified. You can now log in.</Alert>}
      {status === 'error' && <Alert variant="error">{message}</Alert>}
      <p className="mt-6 text-center text-sm text-ink/60">
        <Link to="/login" className="font-medium text-navy-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
