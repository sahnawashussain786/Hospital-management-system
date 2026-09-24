import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, className)} {...props} />
));
Input.displayName = 'Input';

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(base, 'pr-8', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} rows={3} className={cn(base, 'resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Field({ label, required, error, children, className }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
