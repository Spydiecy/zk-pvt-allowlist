# Product Proposal

## What is the product, and who uses it?

Private Allowlist is a membership-proof system for gated access. An admin publishes a list of approved identities as commitment hashes in an on-chain Merkle tree. Anyone on that list can prove they belong — and claim access — without revealing their secret, their position in the tree, or their identity to anyone watching the chain.

The people who use this are anyone running a gated system today that leaks its member list as a side effect of being on-chain: NFT projects running allowlist mints, DAOs restricting governance to vetted members, DeFi protocols gating access to KYC'd users, and token-gated communities. Right now, most of these either publish the entire allowlist publicly (leaking every approved wallet) or rely on a centralized off-chain gatekeeper (reintroducing a trust bottleneck). Private Allowlist removes both problems — the rules are enforced on-chain, but the membership list stays private.

## Why Midnight specifically?

The core requirement here — proving set membership without revealing which member you are — is fundamentally impossible on a transparent chain without either publishing the whole set or trusting a server. If you put a Merkle root on a transparent chain and ask users to submit their path, the path itself reveals their exact position and (combined with any other on-chain activity) usually their identity.

Midnight solves this because the Merkle path and the identity secret are private circuit witnesses — they're consumed inside a zero-knowledge proof and never appear on-chain in any form. The chain only ever sees a nullifier (a one-way hash proving "this specific membership was used") and a root (a commitment to the whole tree). Nobody, including the contract itself, can work backward from a nullifier to figure out which leaf produced it.

You could try to fake this on a transparent chain with off-chain hashing and a trusted relayer, but that just moves the privacy problem to whoever runs the relayer. Midnight removes the need for a trusted third party entirely — the proof is the guarantee.

## Data Model

| Data Point                    | Type             | Disclosed To |
|--------------------------------|------------------|--------------|
| Merkle tree root               | Public ledger    | Everyone     |
| Nullifier (per claim)          | Public set entry | Everyone (but unlinkable to any specific member) |
| Total member count             | Public counter   | Everyone     |
| Total claims                   | Public counter   | Everyone     |
| Member's identity secret       | Private witness  | No one       |
| Merkle path to a member's leaf | Private witness  | No one       |
| Which leaf belongs to which member | Never computed on-chain | No one |

## Mainnet Feasibility

Yes — this is realistic to reach Mainnet by Level 6, and the core primitive (Merkle membership proof + nullifier) is already a proven pattern used by production ZK systems like Tornado Cash and Semaphore. The contract logic is done, tested, and deployed on Preprod. Before Mainnet, three things need attention:

1. **Admin access control** — `add_member` is currently open to any caller for MVP simplicity. Production needs this gated to a contract owner, likely via a signature check or an owner address stored at construction time.
2. **Tree management UX** — right now the frontend calls `findPathForLeaf` by scanning the tree, which is fine at MVP scale but would need indexing support for allowlists with thousands of members.
3. **Secret distribution** — admins currently generate and share secrets out-of-band (e.g. a message). A production version might integrate with existing identity systems (wallet signatures, verifiable credentials) so users don't need to manage a separate secret.

None of these change the core privacy guarantee — they're integration and access-control work on top of a circuit that already does the hard cryptographic part correctly.
