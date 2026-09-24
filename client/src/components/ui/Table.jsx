import { cn } from '@/lib/cn';

export function TableWrap({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children }) {
  return <table className="w-full min-w-[640px] text-left text-sm">{children}</table>;
}

export function Th({ children, className }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }) {
  return <td className={cn('border-b border-slate-100 px-4 py-3.5 text-slate-700', className)}>{children}</td>;
}

export function Tr({ children, className }) {
  return <tr className={cn('transition-colors hover:bg-slate-50/70', className)}>{children}</tr>;
}

export function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of {pages} · {total} records
      </p>
      <div className="flex gap-2">
        <ButtonPager label="Previous" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <ButtonPager label="Next" disabled={page >= pages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
}

function ButtonPager({ label, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}
