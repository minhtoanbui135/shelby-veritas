"use client";

import { ShelbyClientProvider } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
import type { ReactNode } from "react";
import { SHELBY_API_KEY, SHELBY_RPC_URL } from "@/constants";

const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
  apiKey: SHELBY_API_KEY || undefined,
  rpc: SHELBY_RPC_URL ? { baseUrl: SHELBY_RPC_URL } : undefined,
});

export function ShelbyProvider({ children }: { children: ReactNode }) {
  return (
    <ShelbyClientProvider client={shelbyClient}>
      {children}
    </ShelbyClientProvider>
  );
}
