# VERITAS

**On-chain provenance registry for AI-generated art, powered by Aptos and Shelby Protocol.**

VERITAS lets AI artists certify the origin of their work. When you mint through VERITAS, the image is stored permanently on Shelby's decentralized storage network and an NFT is minted on Aptos that locks in the full generation record — model, prompt, seed, steps — as immutable on-chain proof.

---

## What VERITAS Is

VERITAS is a **storage and certification platform**, not an AI image generator. You bring your own AI-generated artwork; VERITAS handles the permanent storage and the on-chain proof of origin.

The problem it solves: AI-generated images are trivially copyable and easy to misattribute. Anyone can screenshot a Midjourney output and claim they made it. VERITAS creates a timestamped, tamper-evident record of *who* registered *what* image, *with which model*, at *what time* — anchored to a blockchain that nobody controls.

---

## Use Cases

### For AI Artists
- **Certify your work.** Mint an NFT that proves you were the first to register a specific image, with the exact prompt and model that produced it.
- **Set your own access rules.** Make your artwork public and free, charge per download, or keep it private.
- **Earn royalties.** Configure a royalty percentage (up to 15%) that is enforced on every access transaction.
- **Build a portfolio.** Your dashboard tracks total mints, views, and revenue across all your registered works.

### For Collectors & Buyers
- **Verify before you buy.** The merkle root stored on-chain is a cryptographic fingerprint of the actual image file. You can independently confirm the file hasn't been swapped or altered.
- **Pay-per-access gating.** Creators can charge APT tokens for downloads. The payment goes directly to the creator's wallet — no intermediary.
- **Browse the gallery.** Discover AI-generated NFTs minted by other creators on the platform.

### For the Broader Ecosystem
- **AI art attribution.** As AI-generated content floods the internet, provenance becomes critical. VERITAS gives creators a credible, decentralized way to establish priority of authorship.
- **Audit trail.** Every provenance record includes the AI model, generation tool, prompt preview, seed, and timestamp. This makes the generation process part of the permanent record, not just the output.
- **Decentralized storage.** Artwork is stored on Shelby Protocol using erasure coding (Clay Codes, 10+6 chunks), so files are recoverable even if nodes go offline. Storage is paid for and committed on-chain.

---

## How It Works

```
You generate an image with an AI tool (Midjourney, Stable Diffusion, FLUX, DALL·E, etc.)
        ↓
Upload the image in VERITAS and fill in the generation details
        ↓
VERITAS encodes the file and registers a blob commitment on Shelby (you sign with your wallet)
        ↓
VERITAS uploads the file to Shelby storage nodes
        ↓
VERITAS mints an Aptos Digital Asset NFT with the full provenance record attached
        ↓
The NFT links your wallet, your image's merkle root, your prompt, and your model — forever
```

> **Note:** VERITAS records whatever you enter in the model and prompt fields. It does not verify that your image was actually produced by the AI model you claim. A future upgrade will integrate direct AI API calls so provenance claims are fully trustworthy end-to-end.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Aptos (Shelbynet / Testnet / Mainnet) |
| Smart contract | Move — `nft_registry` module |
| NFT standard | Aptos Digital Asset (token_objects) |
| Decentralized storage | Shelby Protocol (erasure-coded blob storage) |
| Frontend | Next.js 14, Tailwind CSS |
| Wallet | `@aptos-labs/wallet-adapter-react` |
| Shelby SDK | `@shelby-protocol/sdk`, `@shelby-protocol/react` |

---

## Smart Contract

**Module:** `nft_registry`
**Deployed address:** `0x782ef11c470a095025de751edc28f3dc8a755538db1bd5ce484cd0264917e45d`
**Network:** Shelbynet

### Key functions

| Function | Description |
|---|---|
| `mint_with_provenance` | Store artwork on Shelby and mint NFT in one flow. Auto-creates the creator's collection on first mint. |
| `request_access` | Pay APT to access a paid NFT. Free for public NFTs. |
| `update_access` | Change access type or price. Owner only. |
| `get_provenance` | View — returns the full provenance record for a token. |
| `verify_provenance` | View — checks a claimed merkle root against the stored record. |

### ProvenanceRecord (stored on each token object)

```
blob_path          — Shelby storage path to the artwork
merkle_root        — SHA-256 merkle root of the image file
metadata_hash      — Merkle root of the metadata.json blob
ai_model           — AI model identifier (e.g. "flux-1-dev")
ai_prompt_preview  — Up to 512 characters of the generation prompt
shelby_tx_hash     — Aptos tx that registered the Shelby blob commitment
creation_timestamp — Unix microseconds of mint
royalty_bps        — Royalty in basis points (500 = 5%)
access_type        — 0 = public free, 1 = public paid, 2 = private
price_per_access   — Price in Octas (0 if free)
```

---

## Getting Started

### Prerequisites

- Node.js v20
- An Aptos-compatible wallet (Petra, Pontem, etc.)
- A Shelby Protocol API key — get one at [geomi.dev](https://geomi.dev)

### Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_APP_NETWORK=shelbynet
NEXT_PUBLIC_MODULE_ADDRESS=0x782ef11c470a095025de751edc28f3dc8a755538db1bd5ce484cd0264917e45d
NEXT_PUBLIC_APTOS_API_KEY=your_aptos_api_key
NEXT_PUBLIC_SHELBY_API_KEY=your_shelby_api_key
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy the contract

```bash
cd contract
aptos move publish \
  --named-addresses veritas=YOUR_ADDRESS \
  --private-key YOUR_PRIVATE_KEY \
  --url https://api.shelbynet.shelby.xyz/v1 \
  --assume-yes
```

---

## Roadmap

- [ ] Direct AI image generation via Replicate / fal.ai — making provenance claims fully verifiable end-to-end
- [ ] Marketplace — list, bid, and trade VERITAS NFTs
- [ ] Batch minting
- [ ] Collection-level analytics
- [ ] Mainnet deployment
