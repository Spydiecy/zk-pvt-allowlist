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
              </nav>
            ) : (
              <nav className="nav-links">
                <button className="nav-back" onClick={() => setView('landing')}>← Overview</button>
              </nav>
            )}

            <div className="header-right">
              <WalletConnect />
              {/* Before a wallet is connected there's nothing to "start" —
                  connecting is the first step, and that's the wallet
                  button's job. Once connected, "Start" is the way into
                  the actual app (claim access / add member). */}
              {view === 'landing' && isConnected && (
                <button className="btn btn-primary btn-sm" onClick={() => setView('app')}>Start</button>
              )}
            </div>
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

      <section className="hero reveal">
        <div className="hero-top">
          <div className="hero-copy">
            <p className="kicker">the contract</p>
            <h2 className="hero-title">
              one tree.
              <br />
              membership
              <br />
              nobody can read.
            </h2>
            <p className="hero-desc">
              An admin inserts a member's commitment hash into a
              fixed-depth Merkle tree on-chain. A member later proves
              their commitment is a leaf of that tree inside a
              zero-knowledge circuit — without revealing the secret, the
              leaf's position, or their wallet.
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
        </div>
      </section>

      <section className="circuit-row reveal reveal-delay-1" id="how-it-works">
        <div className="circuit-grid">
          <div className="circuit-card">
            <div className="circuit-card-head">
              <strong>add a member</strong>
              <span className="circuit-index">01</span>
            </div>
            <code className="circuit-fn">add_member(commitment: Bytes&lt;32&gt;)</code>
            <p>Admin inserts a commitment hash as a new leaf in the tree. Only the hash is public — never the secret behind it.</p>
          </div>
          <div className="circuit-card">
            <div className="circuit-card-head">
              <strong>prove membership</strong>
              <span className="circuit-index">02</span>
            </div>
            <code className="circuit-fn">claim_access(secret, path)</code>
            <p>The circuit checks the secret's commitment resolves to the current root via the private Merkle path — both stay off-chain.</p>
          </div>
          <div className="circuit-card">
            <div className="circuit-card-head">
              <strong>stop reuse</strong>
              <span className="circuit-index">03</span>
            </div>
            <code className="circuit-fn">assert(!nullifiers.member(...))</code>
            <p>Inside claim_access, a nullifier derived from the secret is checked and inserted, so one membership can't claim twice.</p>
          </div>
          <div className="circuit-card">
            <div className="circuit-card-head">
              <strong>read state</strong>
              <span className="circuit-index">04</span>
            </div>
            <code className="circuit-fn">members.isFull(), claims.value</code>
            <p>Anyone can read allowlist size, total claims, and tree capacity from the ledger — none of it identifies a single member.</p>
          </div>
        </div>
      </section>

      <section className="requirements-row reveal reveal-delay-2">
        <p className="section-label">Before you start</p>
        <div className="requirements-panel">
          <div className="requirements-panel-head">
            <span className="requirements-panel-dot" />
            <span className="requirements-panel-dot" />
            <span className="requirements-panel-dot" />
            <span className="requirements-panel-title">setup — three steps, five minutes</span>
          </div>

          <div className="requirement-step">
            <span className="requirement-num">01</span>
            <div>
              <strong>Install Lace, set it to Preprod</strong>
              <p>In Lace settings, set the Proof Server URL to <code>localhost:6300</code>.</p>
            </div>
          </div>

          <div className="requirement-step">
            <span className="requirement-num">02</span>
            <div>
              <strong>Run the local proof server</strong>
              <p>Proofs are generated on your machine and never leave it — this is what makes the ZK claim real, not just a UI label.</p>
              <code className="requirement-cmd">docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0</code>
            </div>
          </div>

          <div className="requirement-step">
            <span className="requirement-num">03</span>
            <div>
              <strong>Fund your wallet</strong>
              <p>
                Get test tNIGHT/tDUST from the Preprod faucet — see the{' '}
                <a href="https://github.com/Spydiecy/zk-pvt-allowlist/blob/main/docs/USAGE.md" target="_blank" rel="noreferrer">usage guide</a> for the link.
              </p>
            </div>
          </div>
        </div>
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
