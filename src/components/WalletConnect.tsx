import React from 'react';
import { useMidnight } from '../contexts/useMidnight.tsx';
import { WalletIcon, LockIcon } from './icons';

export function WalletConnect() {
  const { walletStatus, walletAddress, walletError, connect, disconnect } = useMidnight();

  const short = walletAddress
    ? `${walletAddress.slice(0, 16)}…${walletAddress.slice(-6)}`
    : null;

  if (walletStatus === 'connected') {
    return (
      <div className="wallet-area">
        <div className="wallet-pill">
          <span className="dot dot-green" />
          <span className="addr" title={walletAddress ?? ''}>{short}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  if (walletStatus === 'connecting') {
    return (
      <button className="btn btn-ghost" disabled>
        <span className="spin" /> Connecting…
      </button>
    );
  }

  if (walletStatus === 'error') {
    const isLocked = walletError?.toLowerCase().includes('lock');
    return (
      <div className="wallet-area" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div className="wallet-error">
          {isLocked
            ? <><LockIcon size={13} /> Lace service worker is locked. In Lace: lock the wallet → enter password → retry.</>
            : walletError}
        </div>
        <button className="btn btn-primary btn-sm" onClick={connect}>Retry</button>
      </div>
    );
  }

  return (
    <button className="btn btn-primary" onClick={connect}>
      <WalletIcon size={14} /> Connect Lace
    </button>
  );
}
