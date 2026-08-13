import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration: number;
  leaving?: boolean;
}

interface ToastOptions {
  message?: string;
  duration?: number;
}

interface ToastAPI {
  success: (title: string, opts?: ToastOptions) => void;
  error: (title: string, opts?: ToastOptions) => void;
  info: (title: string, opts?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);
const ToastListContext = createContext<ToastItem[]>([]);

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4800,
  error: 6500,
  info: 5000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>[]>>(new Map());

  const dismiss = useCallback((id: number) => {
    // Mark as leaving first so the exit animation can play, then remove.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 260);
    const existing = timers.current.get(id) ?? [];
    timers.current.set(id, [...existing, removeTimer]);
  }, []);

  const push = useCallback((variant: ToastVariant, title: string, opts?: ToastOptions) => {
    const id = ++idRef.current;
    const duration = opts?.duration ?? DEFAULT_DURATION[variant];
    setToasts((prev) => [...prev, { id, variant, title, message: opts?.message, duration }]);
    const autoTimer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, [autoTimer]);
  }, [dismiss]);

  const api: ToastAPI = {
    success: (title, opts) => push('success', title, opts),
    error: (title, opts) => push('error', title, opts),
    info: (title, opts) => push('info', title, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      <ToastListContext.Provider value={toasts}>
        {children}
      </ToastListContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function useToastList(): ToastItem[] {
  return useContext(ToastListContext);
}
