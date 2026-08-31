import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import api from '../../services/api';

export default function CompanySettings() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/companies/me').then(({ data }) => {
      setCompany(data.data.company);
      setForm(data.data.company);
    });
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const { data } = await api.put('/companies/me', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        country: form.country,
        currency: form.currency,
        timezone: form.timezone,
      });
      setCompany(data.data.company);
      setMessage('Company settings updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!company || !form) {
    return <p className="text-sm text-ink/60">Loading company settings…</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Company settings</h1>
        <p className="mt-1 text-sm text-ink/60">Update your organization's profile information.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <Alert variant="error">{error}</Alert>
        <Alert variant="success">{message}</Alert>
        <Input label="Company name" id="name" name="name" value={form.name || ''} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" id="email" name="email" type="email" value={form.email || ''} onChange={handleChange} />
          <Input label="Phone" id="phone" name="phone" value={form.phone || ''} onChange={handleChange} />
        </div>
        <Input label="Address" id="address" name="address" value={form.address || ''} onChange={handleChange} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Country" id="country" name="country" value={form.country || ''} onChange={handleChange} />
          <Input label="Currency" id="currency" name="currency" maxLength={3} value={form.currency || ''} onChange={handleChange} />
          <Input label="Timezone" id="timezone" name="timezone" value={form.timezone || ''} onChange={handleChange} />
        </div>
        <Button type="submit" isLoading={isSaving}>Save changes</Button>
      </form>
    </div>
  );
}
