import React from 'react';
import { MidnightProvider } from './contexts/MidnightContext';
import { ToastProvider } from './contexts/ToastContext';
import { useMidnight } from './contexts/useMidnight.tsx';
import { WalletConnect } from './components/WalletConnect';
import { Allowlist } from './components/Allowlist';
import { Toaster } from './components/Toaster';
import { ResultModal } from './components/ResultModal';
import { MerkleDiagram } from './components/MerkleDiagram';
import { LogoMark, ShieldIcon, TreeIcon, PulseIcon, MintIcon, GovernanceIcon, KeyIcon, UsersIcon } from './components/icons';
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
  const { contractState } = useMidnight();
  return (
    <>
      <Toaster />
      <ResultModal />
      <div className="app">
        <div className="bg-field" aria-hidden="true" />

        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-mark"><LogoMark size={16} /></div>
              <div className="logo-text">
                <h1>Private Allowlist</h1>
                <p>Midnight Network</p>
              </div>
            </div>
            <nav className="nav-links">
              <a href="#how-it-works">How it works</a>
              <a href="#use-cases">Use cases</a>
              <a href="https://github.com/Spydiecy/zk-pvt-allowlist" target="_blank" rel="noreferrer">GitHub</a>
            </nav>
            <WalletConnect />
          </div>
        </header>

        {/* Main content */}
        <main className="main">

          {/* Hero — copy on the left, Merkle proof diagram on the right */}
          <section className="hero-split reveal">
            <div className="hero-copy">
              <p className="kicker">Preprod · Zero-Knowledge Membership</p>
              <h2 className="hero-title">
                Prove you belong.
                <br />
                <span className="hero-title-em">Not who you are.</span>
              </h2>
              <p className="hero-desc">
                A zero-knowledge Merkle proof lets a member show they belong to a
                private allowlist. The chain learns that someone claimed access —
                never which member, and never their secret.
              </p>
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
            <div className="hero-diagram">
              <MerkleDiagram compact />
            </div>
          </section>

          {/* Beginner's 3-step guide — plain-language walkthrough before the
              technical "How it works" section further down. Requested by a
              user testing the app for the first time (docs/FEEDBACK.md #48). */}
          <section className="guide-row reveal reveal-delay-1" id="get-started">
            <p className="section-label">Get started in 3 steps</p>
            <div className="guide-cols">
              <div className="guide-col">
                <span className="guide-num">1</span>
                <strong>Connect your wallet</strong>
                <p>Click "Connect Wallet" above and approve the connection in Lace.</p>
              </div>
              <div className="guide-col">
                <span className="guide-num">2</span>
                <strong>Get a secret</strong>
                <p>An admin adds your secret to the allowlist, or you generate one below.</p>
              </div>
              <div className="guide-col">
                <span className="guide-num">3</span>
                <strong>Claim access</strong>
                <p>Enter your secret and claim — no one else can see which entry is yours.</p>
              </div>
            </div>
          </section>

          {/* Live stat strip */}
          <section className="stat-strip reveal reveal-delay-1">
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

          {/* Core feature — single centered column, not a split grid */}
          <div className="reveal reveal-delay-2">
            <Allowlist />
          </div>

          {/* How it works — horizontal, minimal, below the fold */}
          <section className="how-row reveal reveal-delay-2" id="how-it-works">
            <p className="section-label">How it works</p>
            <div className="how-cols">
              <div className="how-col">
                <span className="how-num">01</span>
                <strong>Admin adds a member</strong>
                <p>Only a commitment hash goes on-chain — never the secret.</p>
              </div>
              <div className="how-col">
                <span className="how-num">02</span>
                <strong>Member proves membership</strong>
                <p>A Merkle path and secret prove inclusion — both stay private.</p>
              </div>
              <div className="how-col">
                <span className="how-num">03</span>
                <strong>Access claimed on-chain</strong>
                <p>A one-time nullifier stops reuse — without revealing identity.</p>
              </div>
            </div>
          </section>

          {/* Use cases — who this is for, below "how it works" */}
          <section className="usecase-row reveal reveal-delay-2" id="use-cases">
            <p className="section-label">Use cases</p>
            <div className="usecase-cols">
              <div className="usecase-col">
                <span className="usecase-icon"><MintIcon size={17} /></span>
                <strong>NFT allowlist mints</strong>
                <p>Gate a mint to approved wallets without publishing the full allowlist for snipers to front-run.</p>
              </div>
              <div className="usecase-col">
                <span className="usecase-icon"><GovernanceIcon size={17} /></span>
                <strong>DAO governance</strong>
                <p>Restrict proposals or votes to vetted members while keeping the roster off the public ledger.</p>
              </div>
              <div className="usecase-col">
                <span className="usecase-icon"><KeyIcon size={17} /></span>
                <strong>DeFi KYC'd access</strong>
                <p>Prove a wallet cleared KYC/AML checks and unlock a pool or feature — without exposing who did.</p>
              </div>
              <div className="usecase-col">
                <span className="usecase-icon"><UsersIcon size={17} /></span>
                <strong>Token-gated communities</strong>
                <p>Let members prove they belong to unlock content or perks, with no on-chain trace of the member list.</p>
              </div>
            </div>
          </section>

        </main>

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

export default function App() {
  return (
    <ToastProvider>
      <MidnightProvider>
        <AppInner />
      </MidnightProvider>
    </ToastProvider>
  );
}
