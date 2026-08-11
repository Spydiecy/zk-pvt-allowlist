/**
 * contract.ts — browser-side contract interaction for the Private Allowlist.
 * Static import so Vite bundles and resolves all bare specifiers.
 */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  persistentHash,
  CompactTypeVector,
  CompactTypeBytes,
} from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Observable, map } from 'rxjs';
import type { AgeGateProviders } from './providers';

// Static import — Vite processes this file and rewrites bare imports to URLs
import * as Allowlist from '../contract/allowlist.js';

export interface AllowlistState {
  memberCount: bigint;
  claims: bigint;
  isFull: boolean;
}

export interface DeployedAllowlist {
  readonly address: string;
  readonly state$: Observable<AllowlistState>;
  addMember: (secretHex: string) => Promise<void>;
  claimAccess: (secretHex: string) => Promise<void>;
  hasClaimed: (secretHex: string) => Promise<boolean>;
}

const PRIVATE_STATE_KEY = 'allowlist-private';

// ── Hashing helpers — mirror the contract's persistentHash([secret, tag]) ────
const PAIR_TYPE = new CompactTypeVector(2, new CompactTypeBytes(32));

function tagBytes(str: string): Uint8Array {
  const t = new Uint8Array(32);
  for (let i = 0; i < str.length; i++) t[i] = str.charCodeAt(i);
  return t;
}

const COMMITMENT_TAG = tagBytes('allowlist-commitment-v1');
const NULLIFIER_TAG = tagBytes('allowlist-nullifier-v1');

function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < Math.min(32, clean.length / 2); i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function commitmentFor(secret: Uint8Array): Uint8Array {
  return persistentHash(PAIR_TYPE, [secret, COMMITMENT_TAG]);
}

function nullifierFor(secret: Uint8Array): Uint8Array {
  return persistentHash(PAIR_TYPE, [secret, NULLIFIER_TAG]);
}

export async function joinAllowlist(
  providers: AgeGateProviders,
  address: string,
): Promise<DeployedAllowlist> {
  const compiled = CompiledContract.make('allowlist', Allowlist.Contract as any).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(`${window.location.origin}/managed/allowlist`),
  );

  const found = await findDeployedContract(providers as any, {
    contractAddress: address as any,
    compiledContract: compiled as any,
    privateStateId: PRIVATE_STATE_KEY,
    initialPrivateState: {},
  });

  const state$: Observable<AllowlistState> = providers.publicDataProvider
    .contractStateObservable(address as any, { type: 'latest' })
    .pipe(
      map((contractState: any) => {
        try {
          const l = Allowlist.ledger(contractState.data ?? contractState);
          return {
            memberCount: BigInt(l.members.firstFree()),
            claims: BigInt(l.claims ?? 0),
            isFull: Boolean(l.members.isFull()),
          };
        } catch {
          return { memberCount: 0n, claims: 0n, isFull: false };
        }
      }),
    );

  return {
    address,
    state$,

    /** Admin action: publish a new member's commitment hash on-chain. */
    async addMember(secretHex: string): Promise<void> {
      const secret = hexToBytes32(secretHex);
      const commitment = commitmentFor(secret);
      await (found as any).callTx.add_member(commitment);
    },

    /** User action: prove membership and claim access without revealing identity. */
    async claimAccess(secretHex: string): Promise<void> {
      const secret = hexToBytes32(secretHex);
      const commitment = commitmentFor(secret);

      // Read the current on-chain tree to locate this member's leaf and path.
      const currentState = await providers.publicDataProvider.queryContractState(address);
      const l = Allowlist.ledger(currentState.data ?? currentState);
      const path = l.members.findPathForLeaf(commitment);
      if (!path) {
        throw new Error('This identity is not on the allowlist.');
      }

      await (found as any).callTx.claim_access(secret, path);
    },

    /** Local-only check: has this secret's nullifier already been spent? */
    async hasClaimed(secretHex: string): Promise<boolean> {
      const secret = hexToBytes32(secretHex);
      const nullifier = nullifierFor(secret);
      const currentState = await providers.publicDataProvider.queryContractState(address);
      const l = Allowlist.ledger(currentState.data ?? currentState);
      return Boolean(l.nullifiers.member(nullifier));
    },
  };
}
