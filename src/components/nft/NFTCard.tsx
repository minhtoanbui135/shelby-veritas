"use client";

import Link from "next/link";
import { Eye, Lock } from "lucide-react";
import type { VeritasNFT } from "@/types/nft";
import { ProofBadge } from "./ProofBadge";
import { HashChip } from "./HashChip";
import { AuthenticatedImage } from "@/components/ui/AuthenticatedImage";
import { truncateAddress } from "@/lib/verify";
import { ACCESS_PAID, ACCESS_PRIVATE } from "@/constants";

interface NFTCardProps {
  nft: VeritasNFT;
}

export function NFTCard({ nft }: NFTCardProps) {
  const isPrivate = nft.provenance.accessType === ACCESS_PRIVATE;
  const isPaid    = nft.provenance.accessType === ACCESS_PAID;

  return (
    <Link href={`/nft/${nft.tokenAddress}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="v-card v-card-glow" style={{ overflow: "hidden" }}>
        {/* Artwork */}
        <div
          style={{
            background: "var(--void)",
            aspectRatio: "1",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {nft.mediaType === "video" ? (
            <video
              src={nft.artworkUrl}
              muted loop autoPlay playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <AuthenticatedImage
              src={nft.artworkUrl}
              alt={nft.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* Access badge overlay */}
          {(isPrivate || isPaid) && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(7,8,9,0.8)",
                border: "1px solid var(--wire-bright)",
                borderRadius: 3,
                padding: "3px 7px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: isPrivate ? "var(--gold)" : "var(--cyan)",
              }}
            >
              <Lock size={9} />
              {isPrivate ? "PRIVATE" : `PAID`}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "14px 14px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: "var(--silver)",
                lineHeight: 1.2,
                flex: 1,
              }}
            >
              {nft.name}
            </h3>
            <ProofBadge status="verified" />
          </div>

          <p style={{ fontSize: 11, color: "var(--mist)", marginTop: 4 }}>
            by {truncateAddress(nft.creator)}
          </p>

          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <HashChip hash={nft.provenance.merkleRoot} />
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ghost)", fontSize: 11 }}>
              <Eye size={11} />
              {nft.totalViews.toString()}
            </div>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="tag">{nft.provenance.aiModel.split("-").slice(0, 2).join(" ")}</span>
            {isPaid && (
              <span className="tag-cyan">
                {(Number(nft.provenance.pricePerAccess) / 1e8).toFixed(4)} APT/view
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
