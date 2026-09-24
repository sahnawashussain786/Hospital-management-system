import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Stethoscope, CalendarDays, FileText, IndianRupee, TrendingUp, Clock,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

function StatCard({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    blue: 'bg-primary-50 text-primary-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, w, st] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/appointments-by-day?days=7'),
          api.get('/dashboard/appointments-by-status'),
        ]);
        if (!cancelled) {
          setStats(s.data);
          setWeekly(w.data.data);
          setByStatus(st.data.data);
        }
        } catch (err) {
          if (!cancelled) toast.error(getErrorMessage(err, 'Failed to load dashboard'));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const s = stats?.stats || {};
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of hospital activity and performance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Patients" value={s.totalPatients ?? 0} tone="blue"
          sub={`${s.admittedPatients ?? 0} currently admitted`} />
        <StatCard icon={Stethoscope} label="Doctors" value={s.totalDoctors ?? 0} tone="violet"
          sub="Active specialists" />
        <StatCard icon={CalendarDays} label="Today's Appointments" value={s.todayAppointments ?? 0} tone="emerald"
          sub={`${s.upcomingAppointments ?? 0} upcoming total`} />
        <StatCard icon={IndianRupee} label="Revenue (Paid)" value={formatCurrency(s.revenue?.paid)} tone="amber"
          sub={`${formatCurrency(s.revenue?.pending)} pending`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly appointments */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Appointments this week</h3>
              <p className="text-xs text-slate-400">Last 7 days</p>
            </div>
            <TrendingUp size={18} className="text-slate-300" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="apptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="count" name="Appointments" stroke="#2563eb" strokeWidth={2.5} fill="url(#apptGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Appointment status</h3>
            <p className="text-xs text-slate-400">All time</p>
          </div>
          <div className="h-72">
            {byStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                    {byStatus.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Legend iconType="circle" formatter={(v) => <span className="text-xs capitalize text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No appointment data yet" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent appointments */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Upcoming appointments</h3>
            <Clock size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentAppointments?.length ? (
              stats.recentAppointments.map((a) => (
                <div key={a._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{a.patient?.name || 'Unknown'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {a.doctor?.name} · {a.doctor?.specialty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">{formatDate(a.date, { weekday: 'short' })}</p>
                    <p className="text-xs text-slate-400">{formatTime(a.time)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming appointments" />
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recently registered patients</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentPatients?.length ? (
              stats.recentPatients.map((p) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.phone}</p>
                  </div>
                  <Badge tone={p.status}>{p.status}</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="No patients yet" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
