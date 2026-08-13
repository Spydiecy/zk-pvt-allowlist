import React, { useState } from 'react';
import { useMidnight } from '../contexts/useMidnight.tsx';
import { LockIcon, BoltIcon, DiceIcon, AlertIcon, ArrowRightIcon } from './icons';

/**
 * Allowlist.tsx — the core privacy feature UI.
 *
 * Two roles, one contract:
 *  - Admin: publish a member's identity commitment on-chain (add_member)
 *  - Member: prove membership and claim access without revealing which
 *    member they are (claim_access) — a Merkle path + secret are supplied
 *    as private witnesses and never transmitted anywhere.
 *
 * On-chain state (allowlist size, claims, capacity) is rendered by the
 * stat strip in App.tsx — this component is purely the action panel.
 */

function randomSecretHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function Allowlist() {
  const {
    walletStatus, contractError,
    txStatus, addMember, claimAccess,
  } = useMidnight();

  const [mode, setMode] = useState<'member' | 'admin'>('member');
  const [secret, setSecret] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  const isConnected = walletStatus === 'connected';
  const isBusy = txStatus === 'proving';

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || isBusy || secret.length !== 64) return;
    await claimAccess(secret);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || isBusy || adminSecret.length !== 64) return;
    await addMember(adminSecret);
  }

  const secretValid = secret.length === 64 && /^[0-9a-f]+$/i.test(secret);

  return (
    <div className="action-panel">
      <div className="action-panel-head">
        <div className="tab-group">
          <button
            className={`tab-btn ${mode === 'member' ? 'tab-btn-active' : ''}`}
            onClick={() => setMode('member')}
          >
            Claim Access
          </button>
          <button
            className={`tab-btn ${mode === 'admin' ? 'tab-btn-active' : ''}`}
            onClick={() => setMode('admin')}
          >
            Admin: Add Member
          </button>
        </div>
        <span className="action-panel-privacy"><LockIcon size={12} /> Secret never leaves this device</span>
      </div>

      {contractError && (
        <div className="result result-fail" style={{ marginBottom: 20 }}>
          <span className="result-icon"><AlertIcon size={20} /></span>
          <div className="result-body">
            <strong>Contract Error</strong>
            <p style={{ wordBreak: 'break-all', fontSize: 11 }}>{contractError}</p>
          </div>
        </div>
      )}

      <div className="action-panel-body">
        {mode === 'member' ? (
          <>
            <div className="action-col">
              <h3>Prove Membership</h3>
              <p className="sub">
                Enter the identity secret you were given. A zero-knowledge proof shows
                it belongs to the allowlist tree — without revealing the secret itself
                or which member you are.
              </p>
              <div className="zk-disclaimer">
                <span className="zk-icon"><BoltIcon /></span>
                <span>
                  <strong style={{ color: 'var(--text)', fontWeight: 600 }}>Proved, not disclosed.</strong>
                  {' '}The chain verifies your commitment matches a leaf in the tree and
                  spends a one-time nullifier — nothing else is ever visible on-chain.
                </span>
              </div>
            </div>

            <form className="action-col" onSubmit={handleClaim}>
              <div className="form-group">
                <label className="form-label" htmlFor="secret">Your identity secret (hex)</label>
                <input
                  id="secret"
                  className="form-input"
                  style={{ fontSize: 13, fontFamily: 'monospace' }}
                  type="text"
                  placeholder="64 hex characters"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value.trim())}
                  disabled={!isConnected || isBusy}
                  autoComplete="off"
                />
                <span className={`form-hint ${secretValid ? 'ok' : ''}`}>
                  {secret.length > 0 && !secretValid ? 'Must be 64 hex characters' : secretValid ? 'Valid secret format' : ' '}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: 20 }}
                onClick={() => setSecret(randomSecretHex())}
              >
                <DiceIcon /> Generate test secret
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={!isConnected || isBusy || !secretValid}
              >
                {isBusy ? <><span className="spin" /> Generating ZK proof…</> : <>Claim access <ArrowRightIcon /></>}
              </button>

              {!isConnected && <p className="helper-note" style={{ textAlign: 'center' }}>Connect your Lace wallet to continue</p>}
            </form>
          </>
        ) : (
          <>
            <div className="action-col">
              <h3>Add a Member</h3>
              <p className="sub">
                Admin-side action. Publishes a commitment hash derived from the member's
                secret as a new leaf in the allowlist tree — the secret itself is never
                stored or transmitted.
              </p>
              <p className="helper-note" style={{ margin: 0 }}>
                Share the generated secret with the member out of band — it's their
                private key to claim access later, via the "Claim Access" tab.
              </p>
            </div>

            <form className="action-col" onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label" htmlFor="adminSecret">New member's secret (hex)</label>
                <input
                  id="adminSecret"
                  className="form-input"
                  style={{ fontSize: 13, fontFamily: 'monospace' }}
                  type="text"
                  placeholder="64 hex characters"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value.trim())}
                  disabled={!isConnected || isBusy}
                  autoComplete="off"
                />
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: 20 }}
                onClick={() => setAdminSecret(randomSecretHex())}
              >
                <DiceIcon /> Generate random secret
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={!isConnected || isBusy || adminSecret.length !== 64}
              >
                {isBusy ? <><span className="spin" /> Submitting…</> : <>Add member to allowlist <ArrowRightIcon /></>}
              </button>

              {!isConnected && <p className="helper-note" style={{ textAlign: 'center' }}>Connect your Lace wallet to continue</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
