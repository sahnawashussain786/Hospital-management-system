import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m) => useToastStore.getState().push(m, 'success'),
  error: (m) => useToastStore.getState().push(m, 'error'),
  info: (m) => useToastStore.getState().push(m, 'info'),
};
