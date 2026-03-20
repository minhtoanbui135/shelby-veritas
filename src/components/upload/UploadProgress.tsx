"use client";

import { Check, Loader2 } from "lucide-react";

export type UploadStep =
  | "idle"
  | "checking"
  | "encoding"
  | "registering"
  | "uploading"
  | "minting"
  | "done"
  | "error";

interface UploadProgressProps {
  step: UploadStep;
  error?: string;
}

const STEPS: { key: UploadStep; label: string; description: string }[] = [
  { key: "checking",    label: "Checking",    description: "Verifying no duplicate files exist on Shelby before uploading" },
  { key: "encoding",    label: "Encoding",    description: "Computing merkle root + erasure coding chunks via Shelby SDK" },
  { key: "registering", label: "Registering", description: "Committing blob to Aptos blockchain — sign wallet transaction" },
  { key: "uploading",   label: "Uploading",   description: "Storing blob across Shelby storage providers (Shelbynet)" },
  { key: "minting",     label: "Minting",     description: "Creating Aptos Digital Asset NFT with provenance record" },
];

const ORDER: UploadStep[] = ["checking", "encoding", "registering", "uploading", "minting", "done"];

function stepIndex(step: UploadStep): number {
  return ORDER.indexOf(step);
}

export function UploadProgress({ step, error }: UploadProgressProps) {
  if (step === "idle") return null;

  const currentIdx = stepIndex(step);

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--wire-bright)",
        borderRadius: 4,
        padding: "20px 20px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <div className="step-node active" style={{ width: 8, height: 8, minWidth: 8 }} />
        <span className="label-xs">
          {step === "done" ? "Complete" : step === "error" ? "Failed" : "Processing..."}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map((s, i) => {
          const isDone    = currentIdx > i || step === "done";
          const isCurrent = step === s.key;

          return (
            <div key={s.key} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {/* Icon */}
              <div
                style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "var(--emerald-dim)" : isCurrent ? "var(--cyan-dim)" : "var(--surface-2)",
                  border: `1px solid ${isDone ? "rgba(0,224,122,0.3)" : isCurrent ? "var(--cyan-border)" : "var(--wire)"}`,
                  marginTop: 1,
                }}
              >
                {isDone ? (
                  <Check size={11} style={{ color: "var(--emerald)" }} />
                ) : isCurrent ? (
                  <Loader2 size={11} className="animate-spin" style={{ color: "var(--cyan)" }} />
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ghost)" }}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                    color: isDone ? "var(--mist)" : isCurrent ? "var(--silver)" : "var(--ghost)",
                  }}
                >
                  {s.label}
                </p>
                {isCurrent && (
                  <p style={{ fontSize: 11, color: "var(--mist)", marginTop: 2 }}>{s.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanline bar */}
      {step !== "done" && step !== "error" && (
        <div className="scanline-progress" style={{ marginTop: 16 }}>
          <div
            className="scanline-progress-bar"
            style={{ width: `${((currentIdx) / (STEPS.length)) * 100}%` }}
          />
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "var(--crimson)", marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}
