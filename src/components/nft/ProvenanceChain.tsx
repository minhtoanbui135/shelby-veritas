"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { ProvenanceRecord } from "@/types/nft";
import { HashChip } from "./HashChip";
import { truncateAddress } from "@/lib/verify";

interface Step {
  label: string;
  sublabel: string;
  confirmed: boolean;
  hash?: string;
  hashLabel?: string;
  link?: string;
}

interface ProvenanceChainProps {
  provenance: ProvenanceRecord;
  tokenAddress: string;
  network?: string;
}

export function ProvenanceChain({
  provenance,
  tokenAddress,
  network = "shelbynet",
}: ProvenanceChainProps) {
  const [expanded, setExpanded] = useState(false);

  const explorerBase = `https://explorer.aptoslabs.com/txn`;

  const steps: Step[] = [
    {
      label: "AI Generation",
      sublabel: `${provenance.aiModel}${provenance.aiPromptPreview ? ` · "${provenance.aiPromptPreview.slice(0, 60)}..."` : ""}`,
      confirmed: true,
    },
    {
      label: "Encoded by Shelby SDK",
      sublabel: "Erasure-coded (16 chunks: 10 data + 6 parity) · Merkle root computed",
      confirmed: !!provenance.merkleRoot,
      hash: provenance.merkleRoot,
      hashLabel: "merkle",
    },
    {
      label: "Registered On-Chain",
      sublabel: "Blob commitment locked in Aptos smart contract · Storage fee paid",
      confirmed: !!provenance.shelbyTxHash,
      hash: provenance.shelbyTxHash,
      hashLabel: "tx",
      link: provenance.shelbyTxHash
        ? `${explorerBase}/${provenance.shelbyTxHash}?network=${network}`
        : undefined,
    },
    {
      label: "Stored on Shelby Protocol",
      sublabel: `Blob path: ${provenance.blobPath}`,
      confirmed: !!provenance.blobPath,
    },
    {
      label: "NFT Minted",
      sublabel: `Token: ${truncateAddress(tokenAddress)} · Royalty: ${Number(provenance.royaltyBps) / 100}%`,
      confirmed: !!tokenAddress,
      hash: tokenAddress,
      hashLabel: "token",
      link: `https://explorer.aptoslabs.com/account/${tokenAddress}?network=${network}`,
    },
  ];

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: "var(--mist)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          padding: "8px 0",
        }}
      >
        Provenance Chain
        <ChevronDown
          size={14}
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms ease" }}
        />
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingLeft: 4,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
          className="animate-fade-in"
        >
          {steps.map((step, i) => (
            <div key={i} className="provenance-step" style={{ paddingBottom: 20 }}>
              <div className={`provenance-dot${step.confirmed ? " confirmed" : ""}`} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: step.confirmed ? "var(--silver)" : "var(--ghost)",
                    }}
                  >
                    {step.label}
                  </span>
                  {step.hash && <HashChip hash={step.hash} label={step.hashLabel} />}
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--mist)", lineHeight: 0 }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--mist)", marginTop: 3, lineHeight: 1.5 }}>
                  {step.sublabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
