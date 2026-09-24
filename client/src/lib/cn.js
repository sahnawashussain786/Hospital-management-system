// Minimal className combiner (no external dependency needed)
export const cn = (...classes) => classes.filter(Boolean).join(' ');
