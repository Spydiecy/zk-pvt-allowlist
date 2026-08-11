/**
 * providers.ts
 * Wires Lace wallet → ZK config → proof provider → indexer → midnight provider.
 * Follows the official example-bboard pattern exactly.
 */

import { type ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  filter,
  firstValueFrom,
  interval,
  map,
  take,
  timeout,
  throwError,
  concatMap,
} from 'rxjs';
import semver from 'semver';

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export type AllowlistCircuitKeys = 'add_member' | 'claim_access';

export interface AgeGateProviders {
  privateStateProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  publicDataProvider: any;
  walletProvider: any;
  midnightProvider: any;
}

function getFirstCompatibleWallet(): InitialAPI | undefined {
  if (typeof window === 'undefined' || !(window as any).midnight) return undefined;
  const wallets = Object.values((window as any).midnight) as any[];
  return wallets.find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies((wallet as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
}

export async function connectToWallet(networkId: string): Promise<ConnectedAPI> {
  // Poll for wallet availability — Lace can take a moment to inject window.midnight
  const initialAPI = await firstValueFrom(
    interval(200).pipe(
      map(() => getFirstCompatibleWallet()),
      filter((w): w is InitialAPI => !!w),
      take(1),
      timeout({
        first: 8_000,
        with: () =>
          throwError(
            () =>
              new Error(
                'Midnight Lace wallet not found. Install the Lace extension and enable it.',
              ),
          ),
      }),
    ),
  );

  // Attempt connect with retries — Lace may show "locked" on first attempt
  // even when unlocked if the extension service worker is just waking up.
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const api = await Promise.race([
        initialAPI.connect(networkId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Lace wallet did not respond within 15s. Make sure it is unlocked and set to Preprod.')), 15_000),
        ),
      ]);
      return api;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If wallet is locked, wait a bit for user to unlock then retry
      if (lastError.message?.toLowerCase().includes('lock') && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error('Failed to connect to wallet');
}

export async function initializeProviders(connectedAPI: ConnectedAPI): Promise<AgeGateProviders> {
  const config = await connectedAPI.getConfiguration();

  // Must be called before any contract operation
  setNetworkId(config.networkId);

  const zkConfigPath = `${window.location.origin}/managed/allowlist`;

  const zkConfigProvider = new FetchZkConfigProvider<AllowlistCircuitKeys>(
    zkConfigPath,
    fetch.bind(window),
  );

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  // In-memory private state provider with full PrivateStateProvider interface
  const privateStateMap = new Map<string, any>();
  const signingKeyMap = new Map<string, Uint8Array>();
  let currentContractAddress: string | undefined;

  const privateStateProvider = {
    setContractAddress(addr: string) {
      currentContractAddress = addr;
    },
    async get(key: string) {
      return privateStateMap.get(key) ?? null;
    },
    async set(key: string, value: any) {
      privateStateMap.set(key, value);
    },
    async remove(key: string) {
      privateStateMap.delete(key);
    },
    async getSigningKey(address: string) {
      return signingKeyMap.get(address) ?? null;
    },
    async setSigningKey(address: string, signingKey: Uint8Array) {
      signingKeyMap.set(address, signingKey);
    },
    // Required for export/import operations (no-op for our use case)
    async exportPrivateStates() { return []; },
    async importPrivateStates() { return { succeeded: [], failed: [] }; },
    async exportSigningKeys() { return []; },
    async importSigningKeys() { return { succeeded: [], failed: [] }; },
  };

  return {
    privateStateProvider,
    zkConfigProvider,
    // Use proverServerUri from wallet config — Lace handles the proof server URL
    proofProvider: httpClientProofProvider(
      config.proverServerUri ?? 'http://localhost:6300',
      zkConfigProvider,
      { timeout: 1800000 },
    ),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
    ),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      async balanceTx(tx: UnboundTransaction, _ttl?: Date): Promise<FinalizedTransaction> {
        const serializedTx = toHex(tx.serialize());
        const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
}
