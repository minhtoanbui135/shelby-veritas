import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { NETWORK, APTOS_API_KEY, SHELBYNET_FULLNODE, SHELBYNET_INDEXER } from "@/constants";
import { Network } from "@aptos-labs/ts-sdk";

// For Shelbynet, configure the custom fullnode and indexer URLs.
// For other networks the SDK uses defaults.
const aptosConfig = new AptosConfig({
  network: NETWORK,
  ...(NETWORK === Network.SHELBYNET
    ? {
        fullnode:  SHELBYNET_FULLNODE,
        indexer:   SHELBYNET_INDEXER,
      }
    : {}),
  clientConfig: { API_KEY: APTOS_API_KEY },
});

const aptos = new Aptos(aptosConfig);

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  return aptos;
}

export function useAptosClient() {
  return aptos;
}
