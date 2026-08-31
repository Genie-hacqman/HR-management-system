import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import * as authService from '../../services/authService';

const initialForm = {
  companyName: '',
  companyEmail: '',
  companyCountry: '',
  companyCurrency: 'USD',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await authService.registerCompany(form);
      navigate('/login', {
        state: { message: 'Company created! Check your email to verify your account, then log in.' },
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach((fe) => { mapped[fe.field] = fe.message; });
        setFieldErrors(mapped);
      }
      setError(data?.message || 'Unable to register your company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your company workspace"
      subtitle="Set up your organization and its first administrator account."
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Alert variant="error">{error}</Alert>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">Company</legend>
          <Input
            label="Company name"
            id="companyName"
            name="companyName"
            placeholder="Acme Corporation"
            value={form.companyName}
            onChange={handleChange}
            error={fieldErrors.companyName}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company email (optional)"
              id="companyEmail"
              name="companyEmail"
              type="email"
              placeholder="hello@acme.com"
              value={form.companyEmail}
              onChange={handleChange}
              error={fieldErrors.companyEmail}
            />
            <Input
              label="Currency"
              id="companyCurrency"
              name="companyCurrency"
              placeholder="USD"
              maxLength={3}
              value={form.companyCurrency}
              onChange={handleChange}
              error={fieldErrors.companyCurrency}
            />
          </div>
          <Input
            label="Country (optional)"
            id="companyCountry"
            name="companyCountry"
            placeholder="Ghana"
            value={form.companyCountry}
            onChange={handleChange}
            error={fieldErrors.companyCountry}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">Your admin account</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              id="adminFirstName"
              name="adminFirstName"
              value={form.adminFirstName}
              onChange={handleChange}
              error={fieldErrors.adminFirstName}
              required
            />
            <Input
              label="Last name"
              id="adminLastName"
              name="adminLastName"
              value={form.adminLastName}
              onChange={handleChange}
              error={fieldErrors.adminLastName}
              required
            />
          </div>
          <Input
            label="Work email"
            id="adminEmail"
            name="adminEmail"
            type="email"
            placeholder="you@acme.com"
            value={form.adminEmail}
            onChange={handleChange}
            error={fieldErrors.adminEmail}
            required
          />
          <Input
            label="Password"
            id="adminPassword"
            name="adminPassword"
            type="password"
            placeholder="At least 8 characters, 1 uppercase, 1 number"
            value={form.adminPassword}
            onChange={handleChange}
            error={fieldErrors.adminPassword}
            required
          />
        </fieldset>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create workspace
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already have a workspace?{' '}
        <Link to="/login" className="font-medium text-navy-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
