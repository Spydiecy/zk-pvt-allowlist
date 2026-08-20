# Private Allowlist

![CI](https://github.com/Spydiecy/zk-pvt-allowlist/actions/workflows/ci.yml/badge.svg)

> Prove you're on the allowlist without revealing who you are. Built on Midnight Network.

## Live Demo

[zk-pvt-allowlist.vercel.app](https://zk-pvt-allowlist.vercel.app/)

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `3f8e0b5179cfaab5689d2d34f87218a3cd2999bcc4ed0c31bc32b0b732e33c21` |

## What This Product Does

Private Allowlist lets an admin publish a gated list of approved identities on-chain — and lets members prove they're on that list without revealing which entry is theirs. An admin commits each member's identity as a hash (a "commitment") into an on-chain Merkle tree. A member later proves membership by supplying their private secret and a Merkle path as witnesses to a zero-knowledge circuit — the proof shows the commitment is a real leaf of the tree, without disclosing the secret, the leaf position, or the member's identity.

This solves a problem every token-gated mint, DAO membership check, and KYC'd DeFi product runs into today: allowlists are almost always public, leaking every approved address to anyone watching the chain. Private Allowlist keeps the list's *contents* private while keeping its *membership rules* fully verifiable — a Merkle root is public, individual entries are not.

Midnight is the only practical way to build this. On a transparent chain, "checking membership" requires reading the list, which means the list itself is public. Midnight's Compact circuits let the membership check happen entirely in zero-knowledge — the chain verifies a mathematical proof instead of reading the data.

## Privacy Model

- **PUBLIC (on-chain, anyone can see):**
  - The Merkle root of the allowlist tree (updated each time a member is added)
  - The set of nullifiers — one per successful claim, proving *a* claim happened
  - The total count of members and total claims

- **PRIVATE (private witness, never on-chain):**
  - Each member's identity secret
  - The Merkle path proving a specific secret's commitment is a tree leaf
  - Which leaf (i.e. which member) is being proven at claim time

- **What the user PROVES without revealing:**
  - That they know a secret whose commitment exists somewhere in the on-chain allowlist tree
  - That this specific membership has not already been used to claim access

## Tech Stack

- Midnight Network (Preprod)
- Compact — ZK smart contract language, `MerkleTree<10, Bytes<32>>` ledger type
- Midnight.js SDK v4.1.1
- DApp Connector API v4.0.1
- React 19 + Vite 6
- Lace Wallet

## Prerequisites

- [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) — set Network to **Preprod**, Proof Server to `http://localhost:6300`
- Docker Desktop running
- Node.js v22+

## Setup & Run Locally

```bash
# Clone
git clone https://github.com/Spydiecy/zk-pvt-allowlist.git
cd zk-pvt-allowlist

# Install
npm install --legacy-peer-deps

# Start the local proof server (required — private data never leaves your machine)
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0

# Generate tDUST in Lace: Tokens → Generate tDUST → confirm

# Start dev server
npm run dev
# Open http://localhost:5173
```

## Run Tests

```bash
npm run test:run
```

32 tests passing — circuit logic, state transitions, and privacy isolation across the allowlist, age-gate, and counter contracts.

## CI/CD

GitHub Actions runs on every push to `main` and on all pull requests. The pipeline installs dependencies, installs the Compact compiler, compiles all three contracts, runs the full test suite, and builds the production frontend. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Usage Guide

See [docs/USAGE.md](./docs/USAGE.md) for a step-by-step, non-technical walkthrough.

## Demo Video

[Watch on YouTube](https://youtu.be/ndI0qxuQSKU)

## Product X Profile

[@zkallowlist](https://x.com/zkallowlist)
