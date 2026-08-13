import React from 'react';

/**
 * icons.tsx — a small hand-drawn icon set used across the app.
 *
 * Replaces emoji (🌙 🔒 ⚡ 🎲 ✅ ❌) with consistent, theme-matched SVG
 * strokes. Emoji render differently per OS/browser and read as "default
 * template" — a single custom icon language is one of the highest-leverage
 * changes for a premium feel.
 */

type IconProps = { size?: number; className?: string };

export function LogoMark({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5c-3.9 2.1-6 4.9-6 8.7 0 4.6 3.6 8.6 8.4 9.3-.9.4-1.9.6-2.9.6C6.3 21.1 2 16.8 2 11.6 2 6.9 5.4 2.9 10 2.1c.7-.1 1.4.2 2 .4z"
        fill="currentColor"
      />
      <circle cx="17.3" cy="8.2" r="1.15" fill="currentColor" opacity="0.9" />
      <circle cx="19.4" cy="12.6" r="0.7" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function LockIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function BoltIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12.5 2 4 14h6.2l-1.2 8L20 10h-6.2l-1.3-8Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"
        fill="rgba(124,92,252,0.14)"
      />
    </svg>
  );
}

export function DiceIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.3" cy="8.3" r="1.15" fill="currentColor" />
      <circle cx="15.7" cy="8.3" r="1.15" fill="currentColor" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" />
      <circle cx="8.3" cy="15.7" r="1.15" fill="currentColor" />
      <circle cx="15.7" cy="15.7" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function WalletIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6.5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.5 6.5V5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="14.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function ShieldIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.2 5 5.8v5.4c0 5 3 8.3 7 9.6 4-1.3 7-4.6 7-9.6V5.8L12 3.2Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
      <path d="M9 12l2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TreeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="19.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 6.5v3M10.5 9 7.4 10.7M13.5 9l3.1 1.7M6 14v3.7M18 14v3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PulseIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12h4l2 6 4-14 2 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GaugeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 15a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 15l4-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7.5 12.5l3.2 3.2L17 9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XCircleIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function AlertIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5 21 19H3L12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10v3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
