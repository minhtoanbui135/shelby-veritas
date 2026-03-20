import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
import { SHELBY_API_KEY, SHELBY_RPC_URL } from "@/constants";

// Singleton Shelby client for browser context
let _client: ShelbyClient | null = null;

export function getShelbyClient(): ShelbyClient {
  if (!_client) {
    _client = new ShelbyClient({
      network: Network.SHELBYNET,
      apiKey: SHELBY_API_KEY || undefined,
      rpc: SHELBY_RPC_URL ? { baseUrl: SHELBY_RPC_URL } : undefined,
    });
  }
  return _client;
}

/**
 * Build the canonical Shelby blob path for an NFT asset.
 * Pattern: <account_hex>/nfts/<slug>/<filename>
 */
export function buildBlobPath(
  accountAddress: string,
  slug: string,
  filename: string,
): string {
  return `${accountAddress}/nfts/${slug}/${filename}`;
}

// Blob HTTP base: SHELBY_RPC_URL already ends with /shelby, giving the correct
// path: https://api.shelbynet.shelby.xyz/shelby/v1/blobs/{account}/{blob_name}
const BLOB_BASE_URL = SHELBY_RPC_URL.replace(/\/$/, "");

/**
 * Build the public Shelby HTTP URL for a blob.
 */
export function buildBlobUrl(
  accountAddress: string,
  slug: string,
  filename: string,
): string {
  return `${BLOB_BASE_URL}/v1/blobs/${accountAddress}/nfts/${slug}/${filename}`;
}

/**
 * Build a blob fetch URL from a raw blobPath (as stored in ProvenanceRecord).
 */
export function blobPathToUrl(blobPath: string): string {
  return `${BLOB_BASE_URL}/v1/blobs/${blobPath}`;
}

/**
 * Check whether a blob already exists on Shelby (before attempting upload).
 * Returns true if a live (non-expired) blob is found at that path.
 */
export async function blobExists(accountAddress: string, blobName: string): Promise<boolean> {
  const url = `${BLOB_BASE_URL}/v1/blobs/${accountAddress}/${blobName}`;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: SHELBY_API_KEY ? { Authorization: `Bearer ${SHELBY_API_KEY}` } : {},
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Slugify a token name for use in blob paths.
 */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
