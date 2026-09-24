import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
