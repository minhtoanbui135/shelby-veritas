export interface ProvenanceRecord {
  blobPath: string;
  merkleRoot: string;
  metadataHash: string;
  aiModel: string;
  aiPromptPreview: string;
  shelbyTxHash: string;
  creationTimestamp: bigint;
  royaltyBps: bigint;
  accessType: number;       // 0=free, 1=paid, 2=private
  pricePerAccess: bigint;   // Octas
}

export interface VeritasNFT {
  tokenAddress: string;
  name: string;
  description: string;
  creator: string;
  owner: string;
  collectionName: string;
  artworkUrl: string;
  thumbnailUrl?: string;
  mediaType: "image" | "video";
  provenance: ProvenanceRecord;
  totalViews: bigint;
  totalRevenue: bigint;
  mintedAt: number;
}

export interface MintParams {
  collectionName: string;
  tokenName: string;
  tokenUri: string;          // public Shelby blob URL for artwork
  blobPath: string;
  merkleRoot: string;
  metadataHash: string;
  aiModel: string;
  aiPromptPreview: string;
  shelbyTxHash: string;
  royaltyBps: number;
  accessType: number;
  pricePerAccess: bigint;
}

export interface UploadResult {
  blobPath: string;
  merkleRoot: string;
  metadataHash: string;
  shelbyTxHash: string;
  artworkUrl: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  provenance: {
    aiModel: string;
    aiModelVersion?: string;
    prompt: string;
    negativePrompt?: string;
    seed?: number;
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    generationTool?: string;
    generatedAt: string;
    generatorWallet: string;
  };
  storage: {
    provider: "shelby";
    network: "shelbynet";
    blobPath: string;
    merkleRoot: string;
    shelbyTxHash: string;
    storedAt: string;
  };
}

// Form state for the Create wizard
export interface CreateFormState {
  // Step 1 — asset
  file: File | null;
  filePreviewUrl: string;
  // Step 2 — provenance
  aiModel: string;
  aiModelVersion: string;
  prompt: string;
  negativePrompt: string;
  seed: string;
  steps: string;
  cfgScale: string;
  sampler: string;
  generationTool: string;
  // Step 3 — NFT details
  tokenName: string;
  description: string;
  royaltyBps: number;
  accessType: number;
  priceOctas: string;
}
