/**
 * Client-side blob integrity verification.
 * Shelby returns the blob's merkle root as the ETag response header.
 * Comparing ETag to the on-chain merkle_root proves the stored asset
 * hasn't changed since it was committed.
 */
export async function verifyBlobIntegrity(
  blobUrl: string,
  onChainMerkleRoot: string,
): Promise<{ verified: boolean; etag: string | null; error?: string }> {
  try {
    const res = await fetch(blobUrl, { method: "HEAD" });
    if (!res.ok) {
      return { verified: false, etag: null, error: `HTTP ${res.status}` };
    }
    const etag = res.headers.get("etag")?.replace(/"/g, "") ?? null;
    const normalized = onChainMerkleRoot.toLowerCase().replace(/^0x/, "");
    return {
      verified: etag?.toLowerCase() === normalized,
      etag,
    };
  } catch (err) {
    return { verified: false, etag: null, error: String(err) };
  }
}

/**
 * Format a hex hash for display: show first N + last N chars.
 */
export function truncateHash(hash: string, head = 8, tail = 6): string {
  const h = hash.replace(/^0x/, "");
  if (h.length <= head + tail) return h;
  return `${h.slice(0, head)}...${h.slice(-tail)}`;
}

/**
 * Format an Aptos address for display.
 */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}
