"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { NFTCard } from "@/components/nft/NFTCard";
import { useGalleryNFTs } from "@/hooks/useGalleryNFTs";
import { Search, Loader2, RefreshCw } from "lucide-react";

const ACCESS_FILTERS = [
  { value: "all", label: "All" },
  { value: "0",   label: "Free" },
  { value: "1",   label: "Paid" },
  { value: "2",   label: "Private" },
];

export default function GalleryPage() {
  const [search, setSearch]       = useState("");
  const [accessFilter, setAccess] = useState("all");

  const { data: nfts = [], isLoading, isError, error, refetch } = useGalleryNFTs();

  const filtered = nfts.filter((nft) => {
    const matchSearch = !search || nft.name.toLowerCase().includes(search.toLowerCase());
    const matchAccess = accessFilter === "all" || nft.provenance.accessType === Number(accessFilter);
    return matchSearch && matchAccess;
  });

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p className="label-xs" style={{ marginBottom: 8 }}>Gallery</p>
            <h1 className="display-md">Verified AI Art</h1>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "1px solid var(--wire-bright)",
              borderRadius: 4, padding: "6px 12px",
              color: "var(--mist)", fontSize: 12, cursor: "pointer",
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ghost)" }} />
            <input
              className="v-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {ACCESS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setAccess(f.value)}
                style={{
                  padding: "6px 14px", borderRadius: 3,
                  border: `1px solid ${accessFilter === f.value ? "var(--cyan-border)" : "var(--wire-bright)"}`,
                  background: accessFilter === f.value ? "var(--cyan-dim)" : "transparent",
                  color: accessFilter === f.value ? "var(--cyan)" : "var(--mist)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--mist)" }}>
            <Loader2 size={24} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13 }}>Loading NFTs from chain…</p>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <p style={{ color: "var(--coral, #f87171)", fontSize: 13, marginBottom: 12 }}>
              {(error as Error)?.message ?? "Failed to load gallery"}
            </p>
            <button onClick={() => refetch()} className="btn-ghost">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <p style={{ color: "var(--ghost)", fontSize: "0.9rem" }}>
              {nfts.length === 0
                ? "No NFTs minted yet. Be the first to mint with provenance."
                : "No results match your filters."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map((nft, i) => (
              <div key={nft.tokenAddress} className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}>
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
