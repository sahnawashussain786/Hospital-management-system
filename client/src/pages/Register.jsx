import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, UserPlus } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import Button from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'receptionist' });
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setAuth(data.token, data.user);
      toast.success('Account created — welcome to MediBook!');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Create your account</h1>
            <p className="text-xs text-slate-500">Staff access to MediBook HMS</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name" required>
            <Input required placeholder="Dr. Jane Doe" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email address" required>
            <Input type="email" required placeholder="you@hospital.com" value={form.email} onChange={set('email')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" required>
              <Input type="password" required placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
            </Field>
            <Field label="Confirm password" required>
              <Input type="password" required placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
            </Field>
          </div>
          <Field label="Role">
            <Select value={form.role} onChange={set('role')}>
              <option value="receptionist">Receptionist</option>
              <option value="doctor">Doctor</option>
            </Select>
          </Field>

          <Button type="submit" loading={loading} className="w-full">
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
