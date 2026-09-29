import React, { useState } from 'react';
import { MidnightProvider } from './contexts/MidnightContext';
import { ToastProvider } from './contexts/ToastContext';
import { useMidnight } from './contexts/useMidnight.tsx';
import { WalletConnect } from './components/WalletConnect';
import { Allowlist } from './components/Allowlist';
import { Toaster } from './components/Toaster';
import { ResultModal } from './components/ResultModal';
import { MerkleDiagram } from './components/MerkleDiagram';
import { LogoMark, ShieldIcon, TreeIcon, PulseIcon, ArrowRightIcon } from './components/icons';
import './styles.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID as string) || 'preprod';
const short = CONTRACT_ADDRESS
  ? `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-8)}`
  : null;
const explorerUrl = CONTRACT_ADDRESS
  ? `https://explorer.${NETWORK_ID}.midnight.network/contracts/stream/${CONTRACT_ADDRESS}`
  : null;

function StatCell({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: 'green' | 'red' }) {
  return (
    <div className="stat-cell">
      <span className={`stat-icon ${tone ? `stat-icon-${tone}` : ''}`}>{icon}</span>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
}

function AppInner() {
  const { contractState, walletStatus } = useMidnight();
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const isConnected = walletStatus === 'connected';

  return (
    <>
      <Toaster />
      <ResultModal />
      <div className="app">
        <div className="bg-field" aria-hidden="true" />

        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <button className="logo logo-btn" onClick={() => setView('landing')} aria-label="Private Allowlist home">
              <div className="logo-mark"><LogoMark size={16} /></div>
              <div className="logo-text">
                <h1>Private Allowlist</h1>
              </div>
            </button>

            {view === 'landing' ? (
              <nav className="nav-links">
                <a href="#how-it-works">How it works</a>
                <a href="https://github.com/Spydiecy/zk-pvt-allowlist" target="_blank" rel="noreferrer">GitHub</a>
                {/* The Start button is redundant once a wallet is connected —
                    the wallet pill on the right already signals "you're in".
                    Only show it for a disconnected first-time visitor. */}
                {!isConnected && (
                  <button className="btn btn-primary btn-sm" onClick={() => setView('app')}>Start</button>
                )}
              </nav>
            ) : (
              <nav className="nav-links">
                <button className="nav-back" onClick={() => setView('landing')}>← Overview</button>
              </nav>
            )}

            <WalletConnect />
          </div>
        </header>

        {view === 'landing' ? (
          <LandingView onStart={() => setView('app')} />
        ) : (
          <AppView contractState={contractState} />
        )}

        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo-mark logo-mark-sm"><LogoMark size={12} /></div>
              <span>Private Allowlist</span>
            </div>
            <div className="footer-links">
              <a href="https://midnight.network" target="_blank" rel="noreferrer">Midnight Network</a>
              <span className="footer-dot">·</span>
              <a href="https://docs.midnight.network/compact" target="_blank" rel="noreferrer">Compact</a>
              <span className="footer-dot">·</span>
              <a href="https://github.com/Spydiecy/zk-pvt-allowlist" target="_blank" rel="noreferrer">Source</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/**
 * LandingView — the marketing page a first-time visitor actually sees.
 * Deliberately short: a headline, one real explanation of the mechanism,
 * a diagram, and how the two circuits work. No filler "use cases" grid,
 * no repeated CTA band — a developer evaluating a ZK tool wants to know
 * what it does and see it work, not scroll past a features carousel.
 */
function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <main className="main">

      <section className="hero-split reveal">
        <div className="hero-copy">
          <p className="kicker">Preprod · Zero-Knowledge Membership</p>
          <h2 className="hero-title">
            Prove you belong.
            <br />
            <span className="hero-title-em">Not who you are.</span>
          </h2>
          <p className="hero-desc">
            An admin publishes members as commitment hashes in an on-chain
            Merkle tree. A member proves inclusion with a zero-knowledge
            circuit — the chain checks a proof instead of reading a list.
            No wallet address is ever tied to a specific entry.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              Open the app <ArrowRightIcon size={16} />
            </button>
            {short && (
              <a
                className="meta-item meta-item-link"
                href={explorerUrl ?? undefined}
                target={explorerUrl ? '_blank' : undefined}
                rel="noreferrer"
              >
                <ShieldIcon size={13} />
                Contract <code>{short}</code>
              </a>
            )}
          </div>
        </div>
        <div className="hero-diagram">
          <MerkleDiagram compact />
        </div>
      </section>

      <section className="how-row reveal reveal-delay-1" id="how-it-works">
        <p className="section-label">How it works</p>
        <div className="how-cols">
          <div className="how-col">
            <span className="how-num">1</span>
            <strong>Admin adds a member</strong>
            <p>Only a commitment hash goes on-chain — never the secret.</p>
          </div>
          <div className="how-col">
            <span className="how-num">2</span>
            <strong>Member proves membership</strong>
            <p>A Merkle path and secret prove inclusion — both stay private.</p>
          </div>
          <div className="how-col">
            <span className="how-num">3</span>
            <strong>Access claimed on-chain</strong>
            <p>A one-time nullifier stops reuse — without revealing identity.</p>
          </div>
        </div>
      </section>

      <section className="requirements-row reveal reveal-delay-2">
        <p className="section-label">Before you start</p>
        <ul className="requirements-list">
          <li>
            <strong>Lace wallet</strong>, set to Preprod, with the Proof Server pointed at <code>localhost:6300</code>
          </li>
          <li>
            The local proof server running in Docker (<code>docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0</code>) — proofs are generated on your machine, never sent anywhere
          </li>
          <li>
            A small tNIGHT/tDUST balance to cover fees — see the <a href="https://github.com/Spydiecy/zk-pvt-allowlist/blob/main/docs/USAGE.md" target="_blank" rel="noreferrer">usage guide</a> for the faucet link
          </li>
        </ul>
      </section>

    </main>
  );
}

/**
 * AppView — the actual product. Live on-chain stats, then the two real
 * actions (claim access / add member) rendered by <Allowlist />.
 */
function AppView({ contractState }: { contractState: ReturnType<typeof useMidnight>['contractState'] }) {
  return (
    <main className="main">
      <section className="stat-strip reveal">
        <StatCell label="Allowlist size" value={contractState?.memberCount?.toString() ?? '—'} icon={<TreeIcon size={14} />} />
        <span className="stat-div" />
        <StatCell label="Access claimed" value={contractState?.claims?.toString() ?? '—'} icon={<PulseIcon size={14} />} />
        <span className="stat-div" />
        <StatCell
          label="Tree capacity"
          value={contractState === null ? '—' : contractState.isFull ? 'Full' : 'Open'}
          tone={contractState?.isFull ? 'red' : 'green'}
          icon={<ShieldIcon size={14} />}
        />
      </section>

      <div className="reveal reveal-delay-1">
        <Allowlist />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MidnightProvider>
        <AppInner />
      </MidnightProvider>
    </ToastProvider>
  );
}
