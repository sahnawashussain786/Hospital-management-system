export const formatDate = (d, opts = {}) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...opts,
      })
    : '—';

export const formatTime = (t) => {
  if (!t) return '—';
  // Server stores times as "HH:mm" 24h strings
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
};

export const formatDateTime = (d) =>
  d ? `${formatDate(d)} · ${formatTime(new Date(d).toTimeString().slice(0, 5))}` : '—';

export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yrs`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const statusTone = {
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  'no-show': 'bg-amber-50 text-amber-700 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  admitted: 'bg-violet-50 text-violet-700 ring-violet-200',
  discharged: 'bg-slate-100 text-slate-600 ring-slate-200',
  outpatient: 'bg-sky-50 text-sky-700 ring-sky-200',
};
