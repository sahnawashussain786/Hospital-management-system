import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export default function ToastHost() {
  const { toasts, dismiss } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg',
              tones[t.type] || tones.info
            )}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
