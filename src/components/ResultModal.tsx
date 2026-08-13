import React, { useEffect, useMemo } from 'react';
import { useMidnight } from '../contexts/useMidnight.tsx';

/**
 * ResultModal — a full-screen animated popup for the outcome of a circuit
 * call (add_member / claim_access). Replaces the old inline result card.
 *
 * The animation is hand-built with SVG + CSS (stroke-draw, spring scale,
 * particle burst) rather than a Lottie JSON file — same "cool animation"
 * payoff with zero extra runtime dependency or third-party asset licensing
 * to track, and it's fully theme-matched to the app's purple/dark palette.
 */

const COPY: Record<string, { success: { title: string; body: string }; failed: { title: string } }> = {
  add_member: {
    success: { title: 'Member Added', body: 'Commitment published on-chain. The secret itself was never stored.' },
    failed: { title: 'Could Not Add Member' },
  },
  claim_access: {
    success: { title: 'Access Claimed', body: 'Membership proof verified on-chain. Your identity was never revealed.' },
    failed: { title: 'Claim Failed' },
  },
};

// Precompute confetti particle trajectories once per module — deterministic
// spread, no per-render randomness/jank.
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.15);
  const dist = 70 + (i % 3) * 22;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    delay: (i % 5) * 0.02,
    size: 5 + (i % 3) * 2,
    hue: i % 2 === 0 ? 'p' : 'g',
  };
});

export function ResultModal() {
  const { txStatus, txError, lastAction, resetTx } = useMidnight();

  const open = (txStatus === 'confirmed' || txStatus === 'failed') && !!lastAction;
  const variant = txStatus === 'confirmed' ? 'success' : 'failed';
  const copy = lastAction ? COPY[lastAction] : null;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') resetTx(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, resetTx]);

  // Auto-close success popups after a beat; let failures linger until dismissed.
  useEffect(() => {
    if (open && variant === 'success') {
      const t = setTimeout(resetTx, 3600);
      return () => clearTimeout(t);
    }
  }, [open, variant, resetTx]);

  const particles = useMemo(() => PARTICLES, []);

  if (!open || !copy) return null;

  return (
    <div className="result-modal-backdrop" onClick={resetTx}>
      <div
        className={`result-modal result-modal-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-label={variant === 'success' ? copy.success.title : copy.failed.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="result-modal-close" aria-label="Close" onClick={resetTx}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="result-modal-art">
          {variant === 'success' ? (
            <>
              <span className="result-ring result-ring-1" />
              <span className="result-ring result-ring-2" />
              {particles.map((p, i) => (
                <span
                  key={i}
                  className={`result-particle result-particle-${p.hue}`}
                  style={{
                    '--tx': `${p.x}px`,
                    '--ty': `${p.y}px`,
                    '--delay': `${p.delay}s`,
                    width: p.size,
                    height: p.size,
                  } as React.CSSProperties}
                />
              ))}
              <svg className="result-icon-svg" viewBox="0 0 80 80" width="72" height="72" fill="none">
                <circle className="result-circle" cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="result-check"
                  d="M24 41l11 11 21-23"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </>
          ) : (
            <svg className="result-icon-svg result-icon-shake" viewBox="0 0 80 80" width="72" height="72" fill="none">
              <circle className="result-circle" cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="result-x"
                d="M28 28l24 24M52 28l-24 24"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        <h3 className="result-modal-title">
          {variant === 'success' ? copy.success.title : copy.failed.title}
        </h3>
        <p className="result-modal-body">
          {variant === 'success' ? copy.success.body : (txError ?? 'Something went wrong.')}
        </p>

        <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={resetTx}>
          {variant === 'success' ? 'Nice' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
