import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { ShelbyProvider } from "@/components/ShelbyProvider";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "VERITAS",
  title: "VERITAS — Verifiable NFT Storage",
  description:
    "AI-generated art with embedded cryptographic provenance on Shelby Protocol and Aptos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <ReactQueryProvider>
            <ShelbyProvider>
              <div id="root">{children}</div>
            </ShelbyProvider>
          </ReactQueryProvider>
        </WalletProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              border: "1px solid var(--wire-bright)",
              color: "var(--silver)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
