# How to Use Private Allowlist

## What You Need

- A computer with a Midnight wallet browser extension installed in Chrome or Edge, e.g. [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk)
- Docker installed and running (this runs the local proof generator)
- About 10 minutes for first-time setup

## Step-by-Step Guide

### 1. Set up your wallet

Open your wallet extension and create or unlock your wallet. In its settings:
- Set **Network** to **Preprod**
- Set **Proof Server** to `http://localhost:6300`

### 2. Start the local proof generator

This runs on your own computer so your private data never leaves it. Open a terminal and run:

```bash
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0
```

Leave this running in the background while you use the app.

### 3. Get some test tokens

If your wallet balance is empty, visit the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev) and paste your wallet address to receive test tokens (tNIGHT). Then in your wallet, go to **Tokens → Generate tDUST** and confirm: this pays for transaction fees.

### 4. Open the app and connect

Go to the live demo link and click **Connect Wallet**. Approve the connection in the wallet popup that appears.

### 5. Two ways to use it

**If you're an admin adding someone to the list:**
1. Click the **"Admin: Add Member"** tab
2. Enter a 64-character secret (or click "Generate Random Secret")
3. Click **"Add Member to Allowlist"** and approve the transaction in your wallet
4. Share that secret privately with the person you just added. They'll need it to prove membership later

**If you're a member claiming access:**
1. Click the **"Claim Access"** tab
2. Paste the secret you were given
3. Click **"Claim Access"**: a zero-knowledge proof is generated in your browser (via your wallet) and submitted on-chain
4. Approve the transaction when your wallet prompts you
5. You'll see "Access Claimed" once it's confirmed

## What Gets Proved (and What Stays Private)

| What happens | Stays private | Becomes public |
|---|---|---|
| Admin adds a member | The secret itself | A one-way hash of it (commitment) |
| Member claims access | The secret, which member you are, your position in the list | That *some* valid member claimed access, and a one-time nullifier proving it hasn't been claimed before |

An outside observer looking at the blockchain can see the size of the allowlist and how many people have claimed access. They cannot see who claimed, which secret was used, or link any claim back to a specific member.

## Troubleshooting

**"Midnight wallet not found"**: Install a Midnight-compatible wallet extension and refresh the page.

**"Wallet did not respond"**: Unlock your wallet by entering your password, then click Retry.

**"No DUST tokens"**: Open your wallet, go to Tokens, click Generate tDUST, confirm the transaction, then try again.

**"This identity is not on the allowlist"**: The secret you entered hasn't been added by an admin yet, or you typed it incorrectly. Double-check the exact 64 characters.

**"Access has already been claimed with this secret"**: Each secret can only claim access once. This is intentional: it stops the same membership from being used twice.

**Proof generation seems stuck**: The first proof can take 30-90 seconds while your wallet downloads its cryptographic key material. Subsequent proofs are much faster. Make sure the Docker proof server is still running.

**"'prove' returned an error: TypeError: Failed to fetch" on the live demo**: This can happen on the hosted Vercel demo. The proof server must run on *your own machine* (that's the whole point: your identity secret and proof generation never leave your computer, even when talking to a public website). Browsers are rolling out a security feature (Private Network Access) that blocks a public HTTPS page from reaching into `localhost` on your machine unless the local server explicitly opts in, which the proof-server image does not do. Enforcement is inconsistent across browsers and versions right now (some browsers only warn and still allow the request; others block it outright), so this may work for you and fail for someone else, or vice versa, with no other change. If you hit this error, the reliable fix is to run the app locally instead:
```bash
git clone https://github.com/Spydiecy/zk-pvt-allowlist.git
cd zk-pvt-allowlist
npm install --legacy-peer-deps
docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.1.0
npm run dev
# open http://localhost:5173 (proofs work here because the page and the proof server are both local)
```
The live Vercel demo is still useful for connecting a wallet and viewing the current on-chain state (allowlist size, claims). It's just not for submitting new proofs.
