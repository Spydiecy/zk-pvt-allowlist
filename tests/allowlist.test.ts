/**
 * allowlist.test.ts — Tests for the Private Allowlist Access contract
 *
 * Tests cover:
 *  1. Circuit logic — add_member and claim_access behave correctly
 *  2. State transitions — nullifiers and claims counter update correctly
 *  3. Privacy model — secret never appears in ledger state; nullifier
 *     reveals only that *a* claim happened, never who made it
 */

import {
  createConstructorContext,
  createCircuitContext,
  emptyZswapLocalState,
  persistentHash,
  CompactTypeVector,
  CompactTypeBytes,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/allowlist/contract/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DUMMY_ADDRESS = '0'.repeat(64);
const DUMMY_KEY = new Uint8Array(32);

const PAIR_TYPE = new CompactTypeVector(2, new CompactTypeBytes(32));

/** Builds a 32-byte tag from an ASCII string, matching pad(32, str) in Compact. */
function tag(str: string): Uint8Array {
  const t = new Uint8Array(32);
  for (let i = 0; i < str.length; i++) t[i] = str.charCodeAt(i);
  return t;
}

const COMMITMENT_TAG = tag('allowlist-commitment-v1');
const NULLIFIER_TAG = tag('allowlist-nullifier-v1');

/** Mirrors the contract's persistentHash([secret, tag]) computation. */
function hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
  return persistentHash(PAIR_TYPE, [a, b]);
}

function commitmentFor(secret: Uint8Array): Uint8Array {
  return hashPair(secret, COMMITMENT_TAG);
}

function nullifierFor(secret: Uint8Array): Uint8Array {
  return hashPair(secret, NULLIFIER_TAG);
}

function secretOf(byte: number): Uint8Array {
  const s = new Uint8Array(32);
  s.fill(byte);
  return s;
}

/** Bootstrap a fresh contract instance. */
function freshState() {
  const contract = new Contract({});
  const ctx = createConstructorContext({}, DUMMY_ADDRESS);
  const init = contract.initialState(ctx);
  return { contract, contractState: init.currentContractState, privateState: init.currentPrivateState };
}

function callAddMember(contract: Contract<any>, contractState: any, privateState: any, commitment: Uint8Array) {
  const ctx = createCircuitContext(DUMMY_ADDRESS, emptyZswapLocalState(DUMMY_KEY), contractState, privateState);
  const r = contract.circuits.add_member(ctx, commitment);
  return { contractState: r.context.currentQueryContext.state, privateState: r.context.currentPrivateState };
}

function callClaimAccess(contract: Contract<any>, contractState: any, privateState: any, secret: Uint8Array, path: any) {
  const ctx = createCircuitContext(DUMMY_ADDRESS, emptyZswapLocalState(DUMMY_KEY), contractState, privateState);
  const r = contract.circuits.claim_access(ctx, secret, path);
  return { contractState: r.context.currentQueryContext.state, privateState: r.context.currentPrivateState };
}

/** Adds a member and returns state + the Merkle path for that member's secret. */
function addMemberAndGetPath(contract: Contract<any>, contractState: any, privateState: any, secret: Uint8Array) {
  const commitment = commitmentFor(secret);
  const index = ledger(contractState.data ?? contractState).members.firstFree();
  const r = callAddMember(contract, contractState, privateState, commitment);
  const path = ledger(r.contractState).members.pathForLeaf(index, commitment);
  return { ...r, path };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Private Allowlist Contract', () => {

  // ── 1. Circuit logic ──────────────────────────────────────────────────────
  describe('Circuit logic', () => {
    it('initialises with an empty tree, no nullifiers, and zero claims', () => {
      const { contractState } = freshState();
      const pub = ledger(contractState.data);
      expect(pub.members.firstFree()).toBe(0n);
      expect(pub.nullifiers.isEmpty()).toBe(true);
      expect(pub.claims).toBe(0n);
    });

    it('add_member inserts a commitment leaf into the Merkle tree', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(1);
      const r = callAddMember(contract, contractState, privateState, commitmentFor(secret));
      expect(ledger(r.contractState).members.firstFree()).toBe(1n);
    });

    it('claim_access succeeds for a valid member with a correct Merkle path', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(2);
      const added = addMemberAndGetPath(contract, contractState, privateState, secret);
      const r = callClaimAccess(contract, added.contractState, added.privateState, secret, added.path);
      expect(ledger(r.contractState).claims).toBe(1n);
    });

    it('claim_access rejects a secret that does not match the given path leaf', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(3);
      const added = addMemberAndGetPath(contract, contractState, privateState, secret);
      const wrongSecret = secretOf(99);
      expect(() =>
        callClaimAccess(contract, added.contractState, added.privateState, wrongSecret, added.path),
      ).toThrow();
    });

    it('claim_access rejects a proof for someone never added to the allowlist', () => {
      const { contract, contractState, privateState } = freshState();
      // Add one member, but try to claim with a completely different secret + a
      // path constructed for the member that IS on the tree — the leaf won't
      // match the outsider's own commitment, so this must fail.
      const memberSecret = secretOf(4);
      const added = addMemberAndGetPath(contract, contractState, privateState, memberSecret);
      const outsiderSecret = secretOf(5);
      expect(() =>
        callClaimAccess(contract, added.contractState, added.privateState, outsiderSecret, added.path),
      ).toThrow();
    });
  });

  // ── 2. State transitions ──────────────────────────────────────────────────
  describe('State transitions', () => {
    it('claims counter increments once per distinct successful claim', () => {
      const { contract, contractState, privateState } = freshState();
      const secretA = secretOf(10);
      const secretB = secretOf(11);

      const addedA = addMemberAndGetPath(contract, contractState, privateState, secretA);
      const addedB = addMemberAndGetPath(contract, addedA.contractState, addedA.privateState, secretB);

      const pathA = ledger(addedB.contractState).members.pathForLeaf(0n, commitmentFor(secretA));
      const r1 = callClaimAccess(contract, addedB.contractState, addedB.privateState, secretA, pathA);
      const r2 = callClaimAccess(contract, r1.contractState, r1.privateState, secretB, addedB.path);

      expect(ledger(r2.contractState).claims).toBe(2n);
    });

    it('the same membership cannot claim access twice (nullifier reuse blocked)', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(20);
      const added = addMemberAndGetPath(contract, contractState, privateState, secret);
      const r1 = callClaimAccess(contract, added.contractState, added.privateState, secret, added.path);
      expect(() => callClaimAccess(contract, r1.contractState, r1.privateState, secret, added.path)).toThrow();
    });

    it('nullifier set contains exactly one entry after one successful claim', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(30);
      const added = addMemberAndGetPath(contract, contractState, privateState, secret);
      const r = callClaimAccess(contract, added.contractState, added.privateState, secret, added.path);
      expect(ledger(r.contractState).nullifiers.size()).toBe(1n);
      expect(ledger(r.contractState).nullifiers.member(nullifierFor(secret))).toBe(true);
    });
  });

  // ── 3. Privacy model — secret never in ledger, nullifier reveals nothing ──
  describe('Privacy model', () => {
    it('ledger only exposes members, nullifiers, and claims — never a secret', () => {
      const { contractState } = freshState();
      const pub = ledger(contractState.data);
      expect(Object.keys(pub).sort()).toEqual(['claims', 'members', 'nullifiers'].sort());
      expect((pub as any).secret).toBeUndefined();
    });

    it('two different members claiming access produce structurally identical state shape', () => {
      const { contract, contractState, privateState } = freshState();
      const secretA = secretOf(40);
      const secretB = secretOf(41);

      const addedA = addMemberAndGetPath(contract, contractState, privateState, secretA);
      const rA = callClaimAccess(contract, addedA.contractState, addedA.privateState, secretA, addedA.path);

      const { contract: contract2, contractState: cs2, privateState: ps2 } = freshState();
      const addedB = addMemberAndGetPath(contract2, cs2, ps2, secretB);
      const rB = callClaimAccess(contract2, addedB.contractState, addedB.privateState, secretB, addedB.path);

      // Both end up with exactly 1 claim and 1 nullifier — an observer
      // cannot distinguish which member claimed just by looking at the ledger.
      expect(ledger(rA.contractState).claims).toBe(ledger(rB.contractState).claims);
      expect(ledger(rA.contractState).nullifiers.size()).toBe(ledger(rB.contractState).nullifiers.size());
    });

    it('secret bytes are not present anywhere in the serialised contract state', () => {
      const { contract, contractState, privateState } = freshState();
      const secret = secretOf(55);
      const added = addMemberAndGetPath(contract, contractState, privateState, secret);
      const r = callClaimAccess(contract, added.contractState, added.privateState, secret, added.path);
      const stateStr = r.contractState?.toString?.() ?? '';
      // The raw secret (all 0x37 bytes) must not appear in the state dump —
      // only its one-way hashes (commitment, nullifier) do.
      const secretHex = Buffer.from(secret).toString('hex');
      expect(stateStr).not.toContain(secretHex);
    });
  });
});
