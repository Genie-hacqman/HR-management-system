import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in to your workspace" subtitle="Enter your work email and password to continue.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert variant="error">{error}</Alert>
        <Input
          label="Work email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-navy-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" isLoading={isLoading} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Registering a new company?{' '}
        <Link to="/register" className="font-medium text-navy-700 hover:underline">
          Create a company workspace
        </Link>
      </p>
    </AuthLayout>
  );
}
