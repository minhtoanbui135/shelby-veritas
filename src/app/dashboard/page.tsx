"use client";

import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCreatorStats } from "@/hooks/useProvenance";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { account, connected } = useWallet();
  const { data: stats, isLoading } = useCreatorStats(account?.address.toString());

  if (!connected) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: 520, margin: "120px auto", padding: "0 24px", textAlign: "center" }}>
          <h1 className="display-md" style={{ marginBottom: 16 }}>Connect Your Wallet</h1>
          <p style={{ color: "var(--mist)", fontSize: "0.9rem" }}>
            Connect an Aptos wallet to view your creator dashboard.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <p className="label-xs" style={{ marginBottom: 8 }}>Creator Dashboard</p>
          <h1 className="display-md">Your VERITAS Portfolio</h1>
          <p style={{ color: "var(--mist)", fontSize: "0.875rem", marginTop: 8 }}>
            {account?.address.toString()}
          </p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--mist)" }} />
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 48 }}
            className="animate-fade-up"
          >
            {[
              { label: "Total Minted",  value: stats?.totalMinted.toString()  ?? "0" },
              { label: "Total Views",   value: stats?.totalViews.toString()   ?? "0" },
              {
                label: "Total Revenue",
                value: stats ? `${(Number(stats.totalRevenue) / 1e8).toFixed(4)} APT` : "0 APT",
              },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA if no NFTs */}
        {!isLoading && stats?.totalMinted === BigInt(0) && (
          <div
            className="v-card animate-fade-up stagger-2"
            style={{ padding: "48px 32px", textAlign: "center" }}
          >
            <h3 className="display-md" style={{ marginBottom: 12 }}>No NFTs yet</h3>
            <p style={{ color: "var(--mist)", fontSize: "0.9rem", marginBottom: 24 }}>
              Mint your first AI artwork with provenance on Shelby Protocol.
            </p>
            <Link href="/create" className="btn-primary">
              Create Your First NFT
            </Link>
          </div>
        )}

        {/* NFT table — populated in Phase 2 via indexer */}
        {!isLoading && stats && stats.totalMinted > BigInt(0) && (
          <div className="v-card animate-fade-up stagger-3" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--wire)" }}>
              <p className="label-xs">Your NFTs</p>
            </div>
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ color: "var(--mist)", fontSize: "0.875rem" }}>
                NFT listing coming in Phase 2 (Aptos indexer integration).
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
