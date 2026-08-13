import React from 'react';
import { useToast, useToastList, type ToastVariant } from '../contexts/ToastContext';

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
      <path
        className="toast-check"
        d="M7 12.5l3.2 3.2L17 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
      <path d="M12 8.5v.01M12 11v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
};

export function Toaster() {
  const toasts = useToastList();
  const { dismiss } = useToast();

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.variant} ${t.leaving ? 'toast-leaving' : 'toast-entering'}`}
          role="status"
          onClick={() => dismiss(t.id)}
        >
          <span className={`toast-icon toast-icon-${t.variant}`}>{ICONS[t.variant]}</span>
          <div className="toast-body">
            <p className="toast-title">{t.title}</p>
            {t.message && <p className="toast-message">{t.message}</p>}
          </div>
          <button
            className="toast-close"
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span
            className="toast-progress"
            style={{ animationDuration: `${t.duration}ms`, animationPlayState: t.leaving ? 'paused' : 'running' }}
          />
        </div>
      ))}
    </div>
  );
}
