/**
 * counter.test.ts: Tests for the Privacy-Preserving Counter contract
 *
 * Tests cover:
 *  1. Circuit logic: increment and reset circuits behave correctly
 *  2. State transitions: counter accumulates across multiple calls
 *  3. Privacy model: increment_by (private input) never appears in ledger
 */

import {
  createConstructorContext,
  createCircuitContext,
  emptyZswapLocalState,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/counter/contract/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DUMMY_ADDRESS = '0'.repeat(64);
const DUMMY_KEY = new Uint8Array(32);

/** Bootstrap a fresh contract and return its initial state objects. */
function freshState() {
  const contract = new Contract({});
  const ctx = createConstructorContext({}, DUMMY_ADDRESS);
  const init = contract.initialState(ctx);
  return { contract, contractState: init.currentContractState, privateState: init.currentPrivateState };
}

/**
 * Read the public count from a contract state.
 * After circuit execution the updated state lives in
 * circuitResult.context.currentQueryContext.state (a ChargedState).
 */
function getCount(contractState: any): bigint {
  // constructorContext returns a ContractState; read via .data (ChargedState)
  return ledger(contractState.data ?? contractState).count;
}

/** Call the increment circuit and return the updated ChargedState. */
function callIncrement(
  contract: Contract<any>,
  contractState: any,
  privateState: any,
  amount: bigint,
): { chargedState: any; privateState: any } {
  const ctx = createCircuitContext(
    DUMMY_ADDRESS,
    emptyZswapLocalState(DUMMY_KEY),
    contractState,
    privateState,
  );
  const result = contract.circuits.increment(ctx, amount);
  return {
    chargedState: result.context.currentQueryContext.state,
    privateState: result.context.currentPrivateState,
  };
}

/** Call the reset circuit and return the updated ChargedState. */
function callReset(
  contract: Contract<any>,
  contractState: any,
  privateState: any,
): { chargedState: any; privateState: any } {
  const ctx = createCircuitContext(
    DUMMY_ADDRESS,
    emptyZswapLocalState(DUMMY_KEY),
    contractState,
    privateState,
  );
  const result = contract.circuits.reset(ctx);
  return {
    chargedState: result.context.currentQueryContext.state,
    privateState: result.context.currentPrivateState,
  };
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Counter Contract', () => {

  // ── 1. Circuit logic ──────────────────────────────────────────────────────
  describe('Circuit logic', () => {
    it('starts at zero after initialisation', () => {
      const { contractState } = freshState();
      expect(getCount(contractState)).toBe(0n);
    });

    it('increment circuit increases count by the given amount', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 5n);
      expect(ledger(r1.chargedState).count).toBe(5n);
    });

    it('reset circuit brings count back to zero', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 10n);
      expect(ledger(r1.chargedState).count).toBe(10n);
      const r2 = callReset(contract, r1.chargedState, r1.privateState);
      expect(ledger(r2.chargedState).count).toBe(0n);
    });

    it('assert rejects a zero increment_by', () => {
      const { contract, contractState, privateState } = freshState();
      expect(() => callIncrement(contract, contractState, privateState, 0n)).toThrow();
    });
  });

  // ── 2. State transitions ──────────────────────────────────────────────────
  describe('State transitions', () => {
    it('multiple increments accumulate correctly', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 3n);
      const r2 = callIncrement(contract, r1.chargedState, r1.privateState, 7n);
      const r3 = callIncrement(contract, r2.chargedState, r2.privateState, 1n);
      expect(ledger(r3.chargedState).count).toBe(11n);
    });

    it('reset after multiple increments returns to zero', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 100n);
      const r2 = callIncrement(contract, r1.chargedState, r1.privateState, 200n);
      const r3 = callReset(contract, r2.chargedState, r2.privateState);
      expect(ledger(r3.chargedState).count).toBe(0n);
    });

    it('counter after reset can be incremented again', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 50n);
      const r2 = callReset(contract, r1.chargedState, r1.privateState);
      const r3 = callIncrement(contract, r2.chargedState, r2.privateState, 42n);
      expect(ledger(r3.chargedState).count).toBe(42n);
    });
  });

  // ── 3. Privacy model: private inputs never in ledger ─────────────────────
  describe('Privacy model: private inputs never exposed', () => {
    it('ledger only exposes count, not increment_by', () => {
      const { contractState } = freshState();
      const publicState = ledger(contractState.data);
      // Ledger type has exactly one field: count
      expect(Object.keys(publicState)).toEqual(['count']);
      expect((publicState as any).increment_by).toBeUndefined();
    });

    it('different private increments are indistinguishable on the public ledger', () => {
      // Reach count=10 via two different private paths (2+8 vs 5+5)
      const { contract, contractState, privateState } = freshState();

      const pathA_r1 = callIncrement(contract, contractState, privateState, 2n);
      const pathA_r2 = callIncrement(contract, pathA_r1.chargedState, pathA_r1.privateState, 8n);

      const pathB_r1 = callIncrement(contract, contractState, privateState, 5n);
      const pathB_r2 = callIncrement(contract, pathB_r1.chargedState, pathB_r1.privateState, 5n);

      // Public ledger states are identical, private increments leave no trace
      expect(ledger(pathA_r2.chargedState).count).toBe(10n);
      expect(ledger(pathB_r2.chargedState).count).toBe(10n);
    });

    it('increment_by is not serialised into the contract state', () => {
      const { contract, contractState, privateState } = freshState();
      const r1 = callIncrement(contract, contractState, privateState, 99n);
      // Serialise the ChargedState toString and check that "increment_by" never appears
      const stateStr = r1.chargedState?.toString() ?? '';
      expect(stateStr).not.toContain('increment_by');
    });
  });
});
