import React from 'react';
import { MidnightProvider } from './contexts/MidnightContext';
import { WalletConnect } from './components/WalletConnect';
import { Allowlist } from './components/Allowlist';
import './styles.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const short = CONTRACT_ADDRESS
  ? `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-8)}`
  : null;

export default function App() {
  return (
    <MidnightProvider>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-mark">🌙</div>
              <div className="logo-text">
                <h1>Private Allowlist</h1>
                <p>Midnight Network</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </header>

        {/* Main content */}
        <main className="main">

          {/* Hero */}
          <div className="hero">
            <div className="hero-chip">Preprod · Zero-Knowledge</div>
            <h2>Prove You're on the List<br />Without Revealing Who You Are</h2>
            <p>
              Membership is proven with a zero-knowledge Merkle proof. The chain
              learns that someone on the allowlist claimed access — never which
              member, and never their secret.
            </p>
            {short && (
              <div className="contract-pill">
                <span>Contract</span>
                <code>{short}</code>
              </div>
            )}
          </div>

          {/* Core feature */}
          <Allowlist />

          {/* How it works */}
          <div className="how-card">
            <p className="card-title" style={{ marginBottom: 24 }}>How It Works</p>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <strong>Admin adds a member</strong>
                <p>Only a commitment hash goes on-chain — never the secret</p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <strong>Member proves membership</strong>
                <p>A Merkle path + secret prove inclusion — both stay private</p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <strong>Access claimed on-chain</strong>
                <p>A one-time nullifier stops reuse — without revealing identity</p>
              </div>
            </div>
          </div>

        </main>

        <footer className="footer">
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noreferrer">Midnight Network</a>
          {' '}· Compact · Midnight.js SDK
        </footer>
      </div>
    </MidnightProvider>
  );
}
