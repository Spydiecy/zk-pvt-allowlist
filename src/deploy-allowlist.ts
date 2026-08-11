/**
 * deploy-allowlist.ts
 * Deploys the allowlist contract to Midnight Preprod or Preview.
 * Usage: NODE_OPTIONS="--max-old-space-size=12288" npm run deploy:preprod
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { resolveNetwork, getOrCreateSeed, recordDeployment } from './network.js';
import { createWallet, persistWalletState, unshieldedToken } from './wallet.js';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'managed', 'allowlist');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const Allowlist = await import(pathToFileURL(contractPath).href);
const compiledContract = CompiledContract.make('allowlist', Allowlist.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

async function waitForProofServer(maxAttempts = 60, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(networkConfig.proofServer, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT') return true;
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  Waiting for proof server... (${attempt}/${maxAttempts})   `);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Deploy allowlist contract to ${network}`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('  Creating wallet...');
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
  if (restoredCount > 0) console.log(`  Restored ${restoredCount}/3 child wallets`);

  console.log('  Syncing with network...');
  const syncInterval = setInterval(() => {
    process.stdout.write(`\r  ⏳ Syncing...`);
  }, 3000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(syncInterval);
  process.stdout.write('\r  ✓ Synced.                    \n');
  await persistWalletState(network, walletCtx);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`\n  Wallet: ${address}`);
  console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

  // Set FUNDED=1 to skip faucet wait when you've already funded externally
  const skipFaucet = process.env.FUNDED === '1';

  if (balance === 0n && !skipFaucet) {
    console.log('─── Fund Wallet ────────────────────────────────────────────────\n');
    console.log(`  Wallet address: ${address}`);
    console.log(`  Faucet: https://midnight-tmnight-${network}.nethermind.dev`);
    console.log('  Waiting for tNIGHT...');
    const start = Date.now();
    while (true) {
      await new Promise((r) => setTimeout(r, 10_000));
      // Force resync to pick up new blocks (faucet tx)
      try {
        const fresh = await walletCtx.wallet.waitForSyncedState();
        const tn = fresh.unshielded.balances[unshieldedToken().raw] ?? 0n;
        if (tn > 0n) { console.log(`\n  Funded! ${tn.toLocaleString()} tNIGHT\n`); balance = tn; break; }
      } catch { /* ignore sync errors, keep polling */ }
      if (Date.now() - start > 1800_000) { console.log('Funding timeout.'); process.exit(1); }
      process.stdout.write(`\r  ...waiting (${Math.round((Date.now()-start)/1000)}s)`);
    }
  }

  // DUST setup
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const unregistered = dustState.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  if (unregistered.length > 0) {
    console.log(`  Registering ${unregistered.length} UTXOs for DUST...`);
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregistered,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload) => walletCtx.unshieldedKeystore.signData(payload),
    );
    await walletCtx.wallet.submitTransaction(await walletCtx.wallet.finalizeRecipe(recipe));
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('  Waiting for DUST...');
    await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced && s.dust.balance(new Date()) > 0n)));
  }
  console.log('  DUST ready!\n');

  if (!await waitForProofServer()) { console.log('❌ Proof server not responding.'); process.exit(1); }
  process.stdout.write('\r  Proof server ready!          \n');

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'allowlist-state',
      accountId,
      privateStoragePasswordProvider: () => 'Allowlist-Dev-2026!',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider, { timeout: 1800000 }),
    walletProvider: {
      getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
      getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
      async balanceTx(tx: any, ttl?: Date) {
        const recipe = await walletCtx.wallet.balanceUnboundTransaction(
          tx,
          { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
          { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
        );
        return walletCtx.wallet.finalizeRecipe(recipe);
      },
      submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
    },
    midnightProvider: { submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any },
  };

  process.stdout.write('  Generating DUST...');
  await new Promise((r) => setTimeout(r, 6000));
  process.stdout.write(' done.\n  Deploying contract...\n');

  const MAX_RETRIES = 50;
  let deployed: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        args: [],
        privateStateId: 'allowlist-private',
        initialPrivateState: {},
      });
      break;
    } catch (err: any) {
      const msg = err?.message ?? '';
      const isDust = msg.includes('Not enough Dust') || msg.includes('Insufficient Funds');
      const isTimeout = msg.includes('Failed to connect to Proof Server');
      if (!(isDust && attempt === 1)) console.error(`\n  Attempt ${attempt}: ${msg}`);
      if (isTimeout && attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 10000)); continue; }
      if (isDust && attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      throw err;
    }
  }

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log('\n  ✅ Allowlist contract deployed!\n');
  console.log(`  Contract Address: ${contractAddress}\n`);
  recordDeployment(network, contractAddress, address.toString());
  console.log('  Saved to .midnight-state.json\n');

  // Write .env.local for frontend
  const envLine = `VITE_CONTRACT_ADDRESS=${contractAddress}\nVITE_NETWORK_ID=${network}\n`;
  fs.writeFileSync(path.resolve(__dirname, '..', '.env.local'), envLine);
  console.log('  Wrote .env.local for frontend build\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
