import React from 'react';

/**
 * MerkleDiagram — a labeled visualization of the zero-knowledge Merkle
 * proof at the heart of the contract. Shows a small tree (visually
 * representing the real depth-10 / 1024-leaf tree) with one member's
 * proof path lit up from leaf to root, and a legend explaining what's
 * public vs private.
 *
 * Pure SVG + CSS — draws itself in on scroll/mount, no dependencies.
 */
export function MerkleDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`merkle-card ${compact ? 'merkle-card-compact' : ''}`}>
      {!compact && (
        <div className="merkle-card-head">
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>The proof</p>
            <h3 className="merkle-title">One path up the tree. Nothing else is visible.</h3>
          </div>
          <div className="merkle-legend">
            <span className="legend-item"><span className="legend-dot legend-dot-dim" /> Other members</span>
            <span className="legend-item"><span className="legend-dot legend-dot-accent" /> Proof path</span>
            <span className="legend-item"><span className="legend-dot legend-dot-green" /> Your commitment</span>
          </div>
        </div>
      )}
      {compact && (
        <div className="merkle-legend merkle-legend-compact">
          <span className="legend-item"><span className="legend-dot legend-dot-accent" /> Proof path</span>
          <span className="legend-item"><span className="legend-dot legend-dot-green" /> Your commitment</span>
        </div>
      )}

      <div className="merkle-diagram">
        <svg viewBox="0 0 720 260" width="100%" height="100%" fill="none" preserveAspectRatio="xMidYMid meet">
          {/* level guide lines */}
          <g className="md-levels">
            <line x1="0" y1="34" x2="720" y2="34" />
            <line x1="0" y1="104" x2="720" y2="104" />
            <line x1="0" y1="174" x2="720" y2="174" />
            <line x1="0" y1="226" x2="720" y2="226" />
          </g>
          <text x="8" y="24" className="md-level-label">Root</text>
          <text x="8" y="94" className="md-level-label">Branch</text>
          <text x="8" y="164" className="md-level-label">Branch</text>
          <text x="8" y="216" className="md-level-label">Leaves · 1 of 1024</text>

          {/* ── dim connective structure (rest of the tree) ── */}
          <g className="md-dim">
            {/* root to branches */}
            <line x1="360" y1="34" x2="180" y2="104" />
            <line x1="360" y1="34" x2="540" y2="104" />
            {/* left branch to its leaves */}
            <line x1="180" y1="104" x2="90" y2="174" />
            <line x1="180" y1="104" x2="270" y2="174" />
            <line x1="90" y1="174" x2="50" y2="226" />
            <line x1="90" y1="174" x2="130" y2="226" />
            <line x1="270" y1="174" x2="230" y2="226" />
            <line x1="270" y1="174" x2="310" y2="226" />
            {/* right branch, non-proof side */}
            <line x1="540" y1="104" x2="450" y2="174" />
            <line x1="450" y1="174" x2="410" y2="226" />
          </g>
          <g className="md-dim-nodes">
            <circle cx="180" cy="104" r="6" />
            <circle cx="90" cy="174" r="5.5" />
            <circle cx="270" cy="174" r="5.5" />
            <circle cx="450" cy="174" r="5.5" />
            <circle cx="50" cy="226" r="5" />
            <circle cx="130" cy="226" r="5" />
            <circle cx="230" cy="226" r="5" />
            <circle cx="310" cy="226" r="5" />
            <circle cx="410" cy="226" r="5" />
          </g>

          {/* ── highlighted proof path: leaf -> branch -> branch -> root ── */}
          <g className="md-path">
            <line className="md-line md-line-1" x1="600" y1="226" x2="540" y2="174" />
            <line className="md-line md-line-2" x1="540" y1="174" x2="540" y2="104" />
            <line className="md-line md-line-3" x1="540" y1="104" x2="360" y2="34" />
          </g>
          {/* sibling leaf on the proof side, dim */}
          <line className="md-dim-line" x1="540" y1="174" x2="680" y2="226" />
          <circle className="md-dim-node" cx="680" cy="226" r="5" />

          <circle className="md-node md-node-1" cx="540" cy="174" r="6.5" />
          <circle className="md-node md-node-2" cx="540" cy="104" r="6" />

          {/* root */}
          <circle className="md-root" cx="360" cy="34" r="9" />
          <circle className="md-root-ring" cx="360" cy="34" r="15" />

          {/* the proving leaf */}
          <rect className="md-leaf" x="590" y="218" width="20" height="16" rx="4" />
        </svg>
      </div>

      {!compact && (
        <div className="merkle-caption">
          <div className="merkle-caption-item">
            <span className="mc-index">01</span>
            <p>Your secret hashes to a commitment — the leaf shown in green.</p>
          </div>
          <div className="merkle-caption-item">
            <span className="mc-index">02</span>
            <p>A private path (purple) proves that leaf resolves to the current root.</p>
          </div>
          <div className="merkle-caption-item">
            <span className="mc-index">03</span>
            <p>Only the root and a one-time nullifier ever touch the chain.</p>
          </div>
        </div>
      )}
    </div>
  );
}
