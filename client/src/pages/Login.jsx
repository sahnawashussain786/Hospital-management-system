import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogIn } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

const demoAccounts = [
  { label: 'Admin', email: 'admin@medibook.com', password: 'admin123' },
  { label: 'Receptionist', email: 'reception@medibook.com', password: 'reception123' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <Activity size={22} />
          </div>
          <span className="text-lg font-semibold">MediBook</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Run your hospital, all from one place.
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Patients, doctors, appointments, prescriptions and billing — a complete
            management system for modern healthcare teams.
          </p>
          <div className="mt-10 flex gap-8">
            {[
              ['20k+', 'Patients managed'],
              ['150+', 'Doctors onboarded'],
              ['99.9%', 'Uptime'],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-primary-400">{v}</p>
                <p className="text-sm text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">© 2026 MediBook HMS. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Activity size={20} />
              </div>
              <span className="text-lg font-semibold text-slate-900">MediBook</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Log in to your account</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your credentials to access the dashboard.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field label="Email address" required>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@hospital.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>

            <Button type="submit" loading={loading} className="w-full">
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
            <div className="mt-2 space-y-1.5">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => setForm({ email: a.email, password: a.password })}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white hover:shadow-sm"
                >
                  <span className="font-medium text-slate-700">{a.label}</span>
                  <span className="text-xs text-slate-400">{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            First time here?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
