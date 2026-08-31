import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import * as authService from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      navigate('/login', { state: { message: 'Password reset. Please log in with your new password.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout eyebrow="Password reset" title="Invalid link">
        <Alert variant="error">This password reset link is missing its token. Please request a new one.</Alert>
        <p className="mt-6 text-center text-sm text-ink/60">
          <Link to="/forgot-password" className="font-medium text-navy-700 hover:underline">
            Request a new reset link
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Password reset" title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert variant="error">{error}</Alert>
        <Input
          label="New password"
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters, 1 uppercase, 1 number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
