/**
 * age-gate.test.ts: Tests for the ZK Age Gate contract
 *
 * Tests cover:
 *  1. Circuit logic: verify_age and revoke_access behave correctly
 *  2. State transitions: access_granted and verifications update correctly
 *  3. Privacy model: birth_year never appears in ledger state
 */

import {
  createConstructorContext,
  createCircuitContext,
  emptyZswapLocalState,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/age-gate/contract/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DUMMY_ADDRESS = '0'.repeat(64);
const DUMMY_KEY = new Uint8Array(32);

/** Bootstrap a fresh contract instance. */
function freshState() {
  const contract = new Contract({});
  const ctx = createConstructorContext({}, DUMMY_ADDRESS);
  const init = contract.initialState(ctx);
  return {
    contract,
    contractState: init.currentContractState,
    privateState: init.currentPrivateState,
  };
}

/** Read public ledger from a ContractState (uses .data = ChargedState). */
function getPublicState(contractState: any) {
  return ledger(contractState.data ?? contractState);
}

/** Call verify_age and return updated state. */
function callVerifyAge(
  contract: Contract<any>,
  contractState: any,
  privateState: any,
  birthYear: bigint,
) {
  const ctx = createCircuitContext(
    DUMMY_ADDRESS,
    emptyZswapLocalState(DUMMY_KEY),
    contractState,
    privateState,
  );
  const r = contract.circuits.verify_age(ctx, birthYear);
  return {
    contractState: r.context.currentQueryContext.state,
    privateState: r.context.currentPrivateState,
  };
}

/** Call revoke_access and return updated state. */
function callRevokeAccess(
  contract: Contract<any>,
  contractState: any,
  privateState: any,
) {
  const ctx = createCircuitContext(
    DUMMY_ADDRESS,
    emptyZswapLocalState(DUMMY_KEY),
    contractState,
    privateState,
  );
  const r = contract.circuits.revoke_access(ctx);
  return {
    contractState: r.context.currentQueryContext.state,
    privateState: r.context.currentPrivateState,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Age Gate Contract', () => {

  // ── 1. Circuit logic ──────────────────────────────────────────────────────
  describe('Circuit logic', () => {
    it('initialises with access_granted = false and verifications = 0', () => {
      const { contractState } = freshState();
      const pub = getPublicState(contractState);
      expect(pub.access_granted).toBe(false);
      expect(pub.verifications).toBe(0n);
    });

    it('grants access for a valid birth year (1995 → 31 years old)', () => {
      const { contract, contractState, privateState } = freshState();
      const r = callVerifyAge(contract, contractState, privateState, 1995n);
      const pub = ledger(r.contractState);
      expect(pub.access_granted).toBe(true);
      expect(pub.verifications).toBe(1n);
    });

    it('rejects a birth year that makes the user under 18 (2015 → 11 years old)', () => {
      const { contract, contractState, privateState } = freshState();
      expect(() => callVerifyAge(contract, contractState, privateState, 2015n)).toThrow();
    });

    it('rejects a future birth year (2030)', () => {
      const { contract, contractState, privateState } = freshState();
      expect(() => callVerifyAge(contract, contractState, privateState, 2030n)).toThrow();
    });

    it('revoke_access resets access_granted to false', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callVerifyAge(contract, contractState, privateState, 1990n);
      expect(ledger(r1.contractState).access_granted).toBe(true);
      const r2 = callRevokeAccess(contract, r1.contractState, r1.privateState);
      expect(ledger(r2.contractState).access_granted).toBe(false);
    });
  });

  // ── 2. State transitions ──────────────────────────────────────────────────
  describe('State transitions', () => {
    it('verifications counter increments on each successful verify', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callVerifyAge(contract, contractState, privateState, 1990n);
      const r2 = callVerifyAge(contract, r1.contractState, r1.privateState, 1985n);
      const r3 = callVerifyAge(contract, r2.contractState, r2.privateState, 1975n);
      expect(ledger(r3.contractState).verifications).toBe(3n);
    });

    it('revoke does not reset the verifications counter', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callVerifyAge(contract, contractState, privateState, 1990n);
      const r2 = callRevokeAccess(contract, r1.contractState, r1.privateState);
      expect(ledger(r2.contractState).verifications).toBe(1n);
    });

    it('access can be re-granted after revoke', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callVerifyAge(contract, contractState, privateState, 1990n);
      const r2 = callRevokeAccess(contract, r1.contractState, r1.privateState);
      const r3 = callVerifyAge(contract, r2.contractState, r2.privateState, 1990n);
      expect(ledger(r3.contractState).access_granted).toBe(true);
    });
  });

  // ── 3. Privacy model: birth_year never in ledger ─────────────────────────
  describe('Privacy model', () => {
    it('ledger only exposes access_granted and verifications, never birth_year', () => {
      const { contractState } = freshState();
      const pub = getPublicState(contractState);
      expect(Object.keys(pub)).toEqual(['access_granted', 'verifications']);
      expect((pub as any).birth_year).toBeUndefined();
    });

    it('two different eligible birth years produce identical ledger states', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callVerifyAge(contract, contractState, privateState, 1990n);
      const r2 = callVerifyAge(contract, contractState, privateState, 1985n);
      // Both are 18+, public state must be identical
      expect(ledger(r1.contractState).access_granted).toBe(ledger(r2.contractState).access_granted);
      expect(ledger(r1.contractState).verifications).toBe(ledger(r2.contractState).verifications);
    });

    it('birth_year is not serialised into contract state', () => {
      const { contract, contractState, privateState } = freshState();
      const r = callVerifyAge(contract, contractState, privateState, 1995n);
      const stateStr = r.contractState?.toString?.() ?? '';
      expect(stateStr).not.toContain('birth_year');
    });
  });
});
