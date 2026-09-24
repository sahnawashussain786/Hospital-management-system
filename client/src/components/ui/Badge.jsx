import { cn } from '@/lib/cn';
import { statusTone } from '@/lib/format';

const fallback = 'bg-slate-100 text-slate-600 ring-slate-200';

export default function Badge({ tone, className, children }) {
  const toneClass = (tone && statusTone[tone]) || fallback;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}
