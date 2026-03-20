"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ProofBadge } from "@/components/nft/ProofBadge";
import { HashChip } from "@/components/nft/HashChip";
import { ProvenanceChain } from "@/components/nft/ProvenanceChain";
import { useProvenance, useAccessStats } from "@/hooks/useProvenance";
import { verifyBlobIntegrity, truncateAddress } from "@/lib/verify";
import { blobPathToUrl } from "@/lib/shelby";
import { ShieldCheck, ShieldX, Loader2, ExternalLink, Eye } from "lucide-react";
import { AuthenticatedImage } from "@/components/ui/AuthenticatedImage";

export default function NFTDetailPage() {
  const params = useParams();
  const tokenAddress = params?.tokenAddress as string;

  const { data: provenance, isLoading: provLoading } = useProvenance(tokenAddress);
  const { data: stats } = useAccessStats(tokenAddress);

  const [verifying, setVerifying]   = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; etag: string | null } | null>(null);

  async function handleVerify() {
    if (!provenance) return;
    setVerifying(true);
    const blobUrl = blobPathToUrl(provenance.blobPath);
    const result  = await verifyBlobIntegrity(blobUrl, provenance.merkleRoot);
    setVerifyResult(result);
    setVerifying(false);
  }

  if (provLoading) {
    return (
      <>
        <Header />
        <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--mist)" }} />
        </main>
      </>
    );
  }

  if (!provenance) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: 600, margin: "120px auto", padding: "0 24px", textAlign: "center" }}>
          <h2 className="display-md">NFT Not Found</h2>
          <p style={{ color: "var(--mist)", marginTop: 12, fontSize: "0.9rem" }}>
            No provenance record found for token{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)", fontSize: 12 }}>
              {truncateAddress(tokenAddress)}
            </span>
          </p>
        </main>
      </>
    );
  }

  const artworkUrl    = blobPathToUrl(provenance.blobPath);
  const isVideo       = provenance.blobPath.endsWith(".mp4") || provenance.blobPath.endsWith(".webm");
  const royaltyPct    = Number(provenance.royaltyBps) / 100;

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

          {/* Left: Artwork */}
          <div>
            <div className="artwork-frame animate-fade-in" style={{ aspectRatio: "1", marginBottom: 16 }}>
              {isVideo ? (
                <video src={artworkUrl} controls loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <AuthenticatedImage src={artworkUrl} alt="NFT Artwork" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              )}
            </div>

            {/* Verify button */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.8rem" }}
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                {verifying ? "Verifying..." : "Verify Integrity"}
              </button>

              {verifyResult && (
                <span
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 600,
                    color: verifyResult.verified ? "var(--emerald)" : "var(--crimson)",
                  }}
                >
                  {verifyResult.verified ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                  {verifyResult.verified ? "Asset matches on-chain proof" : "Mismatch — asset may have changed"}
                </span>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Name + badges */}
            <div className="animate-fade-up stagger-1">
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <ProofBadge status={provenance.aiPromptPreview ? "verified" : "partial"} />
                <span className="tag">{provenance.aiModel}</span>
              </div>

              <h1 className="display-md" style={{ marginBottom: 8 }}>
                Token {truncateAddress(tokenAddress)}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--mist)", lineHeight: 1.65 }}>
                {provenance.aiPromptPreview}
              </p>
            </div>

            {/* Stats row */}
            <div
              className="animate-fade-up stagger-2"
              style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
            >
              {[
                { label: "Views",   value: stats?.totalViews.toString() ?? "—"     },
                { label: "Revenue", value: stats ? `${(Number(stats.totalRevenue) / 1e8).toFixed(4)} APT` : "—" },
                { label: "Royalty", value: `${royaltyPct}%` },
              ].map((s) => (
                <div key={s.label} className="stat-card" style={{ flex: 1, minWidth: 80 }}>
                  <div className="stat-value" style={{ fontSize: "1.25rem" }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Proof data */}
            <div className="v-card animate-fade-up stagger-3" style={{ padding: "16px 18px" }}>
              <p className="label-xs" style={{ marginBottom: 14 }}>Cryptographic Proof</p>
              <div className="data-row">
                <span className="data-row-key">Merkle Root</span>
                <HashChip hash={provenance.merkleRoot} />
              </div>
              <div className="data-row">
                <span className="data-row-key">Metadata Hash</span>
                <HashChip hash={provenance.metadataHash} variant="gold" />
              </div>
              <div className="data-row">
                <span className="data-row-key">Shelby Tx</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <HashChip hash={provenance.shelbyTxHash} label="tx" />
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${provenance.shelbyTxHash}?network=shelbynet`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--mist)", lineHeight: 0 }}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div className="data-row">
                <span className="data-row-key">Blob Path</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--mist)", textAlign: "right", wordBreak: "break-all", maxWidth: 200 }}>
                  {provenance.blobPath}
                </span>
              </div>
            </div>

            {/* Provenance chain */}
            <div className="v-card animate-fade-up stagger-4" style={{ padding: "16px 18px" }}>
              <ProvenanceChain
                provenance={provenance}
                tokenAddress={tokenAddress}
                network="shelbynet"
              />
            </div>

            {/* Raw blob link */}
            <div className="animate-fade-up stagger-5">
              <a
                href={artworkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ fontSize: "0.8rem", width: "100%", justifyContent: "center" }}
              >
                <Eye size={13} />
                View Raw Asset on Shelby
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
