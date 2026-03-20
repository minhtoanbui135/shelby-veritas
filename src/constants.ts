import { Network } from "@aptos-labs/ts-sdk";

// Shelbynet is the live Shelby Protocol development network.
// It runs its own Aptos validator set under the "shelbynet" network name.
const rawNetwork = process.env.NEXT_PUBLIC_APP_NETWORK ?? "shelbynet";

export const NETWORK: Network =
  rawNetwork === "shelbynet" ? Network.SHELBYNET :
  rawNetwork === "mainnet"   ? Network.MAINNET   :
  rawNetwork === "devnet"    ? Network.DEVNET     :
  Network.TESTNET;

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS ?? "";
export const APTOS_API_KEY  = process.env.NEXT_PUBLIC_APTOS_API_KEY  ?? "";

// Shelby
export const SHELBY_API_KEY = process.env.NEXT_PUBLIC_SHELBY_API_KEY ?? "";
export const SHELBY_RPC_URL =
  process.env.NEXT_PUBLIC_SHELBY_RPC_URL ??
  "https://api.shelbynet.shelby.xyz/shelby";

// Shelbynet Aptos infrastructure URLs
export const SHELBYNET_FULLNODE = "https://api.shelbynet.shelby.xyz/v1";
export const SHELBYNET_INDEXER  = "https://api.shelbynet.shelby.xyz/v1/graphql";
export const SHELBYNET_FAUCET   = "https://faucet.shelbynet.shelby.xyz";
export const EXPLORER_NETWORK   = rawNetwork; // used in ?network= query param

export const EXPIRY_5_YEARS_MICROS =
  BigInt(5 * 365 * 24 * 60 * 60) * BigInt(1_000_000);

// Contract function names
export const FN_CREATE_COLLECTION    = `${MODULE_ADDRESS}::nft_registry::create_collection`;
export const FN_MINT_WITH_PROVENANCE = `${MODULE_ADDRESS}::nft_registry::mint_with_provenance`;
export const FN_REQUEST_ACCESS       = `${MODULE_ADDRESS}::nft_registry::request_access`;
export const FN_UPDATE_ACCESS        = `${MODULE_ADDRESS}::nft_registry::update_access`;
export const VIEW_GET_PROVENANCE     = `${MODULE_ADDRESS}::nft_registry::get_provenance`;
export const VIEW_VERIFY_PROVENANCE  = `${MODULE_ADDRESS}::nft_registry::verify_provenance`;
export const VIEW_GET_ACCESS_STATS   = `${MODULE_ADDRESS}::nft_registry::get_access_stats`;
export const VIEW_GET_CREATOR_STATS  = `${MODULE_ADDRESS}::nft_registry::get_creator_stats`;
export const VIEW_HAS_PROVENANCE     = `${MODULE_ADDRESS}::nft_registry::has_provenance`;
export const VIEW_GET_ACCESS_CONFIG  = `${MODULE_ADDRESS}::nft_registry::get_access_config`;

// Access types
export const ACCESS_PUBLIC  = 0;
export const ACCESS_PAID    = 1;
export const ACCESS_PRIVATE = 2;

export const VERITAS_COLLECTION = "VERITAS";

export const AI_MODELS = [
  { id: "stable-diffusion-3.5",   label: "Stable Diffusion 3.5" },
  { id: "stable-diffusion-xl",    label: "Stable Diffusion XL" },
  { id: "flux-1-dev",             label: "FLUX.1 Dev" },
  { id: "flux-1-schnell",         label: "FLUX.1 Schnell" },
  { id: "midjourney-6",           label: "Midjourney v6" },
  { id: "dall-e-3",               label: "DALL·E 3" },
  { id: "ideogram-2",             label: "Ideogram 2" },
  { id: "adobe-firefly-3",        label: "Adobe Firefly 3" },
  { id: "other",                  label: "Other" },
];

export const GENERATION_TOOLS = [
  "ComfyUI", "Automatic1111 (A1111)", "Forge",
  "Fooocus", "InvokeAI", "API Direct", "Other",
];
