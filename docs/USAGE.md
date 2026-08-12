# How to Use Private Allowlist

## What You Need

- A computer with [Lace wallet](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) installed in Chrome or Edge
- Docker installed and running (this runs the local proof generator)
- About 10 minutes for first-time setup

## Step-by-Step Guide

### 1. Set up your wallet

Open the Lace extension and create or unlock your wallet. In Lace settings:
- Set **Network** to **Preprod**
- Set **Proof Server** to `http://localhost:6300`

### 2. Start the local proof generator

This runs on your own computer so your private data never leaves it. Open a terminal and run:

```bash
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0
```

Leave this running in the background while you use the app.

### 3. Get some test tokens

If your Lace wallet balance is empty, visit the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev) and paste your wallet address to receive test tokens (tNIGHT). Then in Lace, go to **Tokens → Generate tDUST** and confirm — this pays for transaction fees.

### 4. Open the app and connect

Go to the live demo link and click **Connect Lace**. Approve the connection in the Lace popup that appears.

### 5. Two ways to use it

**If you're an admin adding someone to the list:**
1. Click the **"Admin: Add Member"** tab
2. Enter a 64-character secret (or click "Generate Random Secret")
3. Click **"Add Member to Allowlist"** and approve the transaction in Lace
4. Share that secret privately with the person you just added — they'll need it to prove membership later

**If you're a member claiming access:**
1. Click the **"Claim Access"** tab
2. Paste the secret you were given
3. Click **"Claim Access"** — a zero-knowledge proof is generated in your browser (via Lace) and submitted on-chain
4. Approve the transaction when Lace prompts you
5. You'll see "Access Claimed" once it's confirmed

## What Gets Proved (and What Stays Private)

| What happens | Stays private | Becomes public |
|---|---|---|
| Admin adds a member | The secret itself | A one-way hash of it (commitment) |
| Member claims access | The secret, which member you are, your position in the list | That *some* valid member claimed access, and a one-time nullifier proving it hasn't been claimed before |

An outside observer looking at the blockchain can see the size of the allowlist and how many people have claimed access. They cannot see who claimed, which secret was used, or link any claim back to a specific member.

## Troubleshooting

**"Midnight Lace wallet not found"** — Install the Lace extension and refresh the page.

**"Lace wallet did not respond"** — Unlock Lace by entering your password, then click Retry.

**"No DUST tokens"** — Open Lace, go to Tokens, click Generate tDUST, confirm the transaction, then try again.

**"This identity is not on the allowlist"** — The secret you entered hasn't been added by an admin yet, or you typed it incorrectly. Double-check the exact 64 characters.

**"Access has already been claimed with this secret"** — Each secret can only claim access once. This is intentional — it stops the same membership from being used twice.

**Proof generation seems stuck** — The first proof can take 30-90 seconds while Lace downloads its cryptographic key material. Subsequent proofs are much faster. Make sure the Docker proof server is still running.
