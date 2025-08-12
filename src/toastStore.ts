import { create } from 'zustand';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = crypto.randomUUID();
    const timeoutId = setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
    set((state) => {
      if (state.toasts.length >= 5) {
        clearTimeout(timeoutId);
        return { toasts: state.toasts };
      }
      return { toasts: [...state.toasts, { id, message, type, timeoutId }] };
    });
  },
  removeToast: (id) =>
    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (toast) {
        clearTimeout(toast.timeoutId);
      }
      return { toasts: state.toasts.filter((t) => t.id !== id) };
    }),
}));
