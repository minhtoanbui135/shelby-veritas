"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { truncateHash } from "@/lib/verify";

interface HashChipProps {
  hash: string;
  label?: string;
  variant?: "cyan" | "gold";
  head?: number;
  tail?: number;
}

export function HashChip({ hash, label, variant = "cyan", head = 8, tail = 6 }: HashChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      className={`hash-chip${variant === "gold" ? " gold" : ""}`}
      onClick={copy}
      title={`${label ? label + ": " : ""}${hash}\nClick to copy`}
      style={{ cursor: "pointer", border: "none" }}
    >
      {label && (
        <span style={{ color: "var(--mist)", fontSize: 10, marginRight: 2 }}>
          {label}
        </span>
      )}
      <span>{truncateHash(hash, head, tail)}</span>
      {copied ? (
        <Check size={10} />
      ) : (
        <Copy size={10} style={{ opacity: 0.5 }} />
      )}
    </button>
  );
}
