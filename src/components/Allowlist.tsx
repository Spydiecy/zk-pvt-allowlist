import React, { useState } from 'react';
import { useMidnight } from '../contexts/useMidnight.tsx';

/**
 * Allowlist.tsx — the core privacy feature UI.
 *
 * Two roles, one contract:
 *  - Admin: publish a member's identity commitment on-chain (add_member)
 *  - Member: prove membership and claim access without revealing which
 *    member they are (claim_access) — a Merkle path + secret are supplied
 *    as private witnesses and never transmitted anywhere.
 */

function randomSecretHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function Allowlist() {
  const {
    walletStatus, contractState, contractError,
    txStatus, txError, addMember, claimAccess,
  } = useMidnight();

  const [mode, setMode] = useState<'member' | 'admin'>('member');
  const [secret, setSecret] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  const isConnected = walletStatus === 'connected';
  const isBusy = txStatus === 'proving';

  function handleGenerateSecret() {
    const s = randomSecretHex();
    setSecret(s);
  }

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
    <>
      <div className="grid">
        {/* On-chain state */}
        <div className="card">
          <p className="card-title">On-Chain State</p>

          <div className="state-row">
            <span className="state-label">Allowlist Size</span>
            <span className="state-value">{contractState?.memberCount?.toString() ?? '—'}</span>
          </div>
          <div className="state-row">
            <span className="state-label">Total Claims</span>
            <span className="state-value">{contractState?.claims?.toString() ?? '—'}</span>
          </div>
          <div className="state-row">
            <span className="state-label">Tree Full</span>
            <span className={`badge ${contractState?.isFull ? 'badge-red' : 'badge-green'}`}>
              {contractState === null ? '—' : contractState.isFull ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="privacy-note">
            🔒 On-chain observers see the tree size and claim count. They cannot
            see which secret was used to claim, or match a claim to a member.
          </div>

          {contractError && (
            <div className="result result-fail" style={{ marginTop: 14 }}>
              <span className="result-icon">⚠</span>
              <div className="result-body">
                <strong>Contract Error</strong>
                <p style={{ wordBreak: 'break-all', fontSize: 11 }}>{contractError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action panel */}
        <div className="gate-card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              className={mode === 'member' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              onClick={() => setMode('member')}
            >
              Claim Access
            </button>
            <button
              className={mode === 'admin' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              onClick={() => setMode('admin')}
            >
              Admin: Add Member
            </button>
          </div>

          {mode === 'member' ? (
            <>
              <h3>Prove Membership</h3>
              <p className="sub">Your secret never leaves this device.</p>

              <form onSubmit={handleClaim}>
                <div className="form-group">
                  <label className="form-label" htmlFor="secret">Your Identity Secret (hex)</label>
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

                <div className="zk-disclaimer">
                  <span className="zk-icon">⚡</span>
                  <span>
                    <strong style={{ color: '#fff', fontWeight: 600 }}>Proved without revealing</strong>
                    {' '}— a ZK proof shows your secret's commitment is in the allowlist
                    tree, without revealing your secret or which member you are.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={!isConnected || isBusy || !secretValid}
                >
                  {isBusy ? <><span className="spin" /> Generating ZK Proof…</> : '→ Claim Access'}
                </button>
              </form>

              {txStatus === 'confirmed' && (
                <div className="result result-success">
                  <span className="result-icon">✅</span>
                  <div className="result-body">
                    <strong>Access Claimed</strong>
                    <p>Membership proof verified on-chain. Your identity was never revealed.</p>
                  </div>
                </div>
              )}
              {txStatus === 'failed' && txError && (
                <div className="result result-fail">
                  <span className="result-icon">❌</span>
                  <div className="result-body">
                    <strong>Claim Failed</strong>
                    <p>{txError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Add a Member (Admin)</h3>
              <p className="sub">Publish a commitment hash — the secret itself is never stored.</p>

              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label" htmlFor="adminSecret">New Member's Secret (hex)</label>
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
                  style={{ marginBottom: 16 }}
                  onClick={() => setAdminSecret(randomSecretHex())}
                >
                  🎲 Generate Random Secret
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={!isConnected || isBusy || adminSecret.length !== 64}
                >
                  {isBusy ? <><span className="spin" /> Submitting…</> : '→ Add Member to Allowlist'}
                </button>
              </form>

              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
                Share the generated secret with the member out of band — it's their
                private key to claim access later, via the "Claim Access" tab.
              </p>
            </>
          )}

          {!isConnected && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
              Connect your Lace wallet to continue
            </p>
          )}

          {isConnected && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={handleGenerateSecret}
            >
              🎲 Generate a Test Secret
            </button>
          )}
        </div>
      </div>
    </>
  );
}
