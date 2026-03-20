"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { HashChip } from "@/components/nft/HashChip";
import { ProofBadge } from "@/components/nft/ProofBadge";
import { useMint } from "@/hooks/useMint";
import type { CreateFormState } from "@/types/nft";
import { AI_MODELS, GENERATION_TOOLS, ACCESS_PUBLIC, ACCESS_PAID, ACCESS_PRIVATE } from "@/constants";
import { CheckCircle2, ExternalLink, ChevronDown, Sparkles } from "lucide-react";
import { extractImageMeta } from "@/lib/parseImageMeta";

// Sane defaults per model family
const MODEL_DEFAULTS: Record<string, { steps: string; cfgScale: string; sampler: string; generationTool: string }> = {
  "stable-diffusion-3.5": { steps: "28", cfgScale: "7",   sampler: "DPM++ 2M Karras", generationTool: "" },
  "stable-diffusion-xl":  { steps: "30", cfgScale: "7",   sampler: "DPM++ 2M Karras", generationTool: "" },
  "flux-1-dev":           { steps: "20", cfgScale: "3.5", sampler: "Euler",            generationTool: "" },
  "flux-1-schnell":       { steps: "4",  cfgScale: "1",   sampler: "Euler a",          generationTool: "" },
  "midjourney-6":         { steps: "",   cfgScale: "",    sampler: "",                 generationTool: "" },
  "dall-e-3":             { steps: "",   cfgScale: "",    sampler: "",                 generationTool: "API Direct" },
  "ideogram-2":           { steps: "",   cfgScale: "",    sampler: "",                 generationTool: "API Direct" },
  "adobe-firefly-3":      { steps: "",   cfgScale: "",    sampler: "",                 generationTool: "API Direct" },
  "other":                { steps: "",   cfgScale: "",    sampler: "",                 generationTool: "" },
};

function randomSeed() {
  return String(Math.floor(Math.random() * 1_000_000_000));
}

const INITIAL: CreateFormState = {
  file: null, filePreviewUrl: "",
  aiModel: "stable-diffusion-3.5", aiModelVersion: "", prompt: "",
  negativePrompt: "", seed: randomSeed(), steps: "28", cfgScale: "7", sampler: "DPM++ 2M Karras", generationTool: "",
  tokenName: "", description: "", royaltyBps: 500, accessType: ACCESS_PUBLIC, priceOctas: "",
};

const STEP_LABELS = ["Upload", "Provenance", "Details", "Mint"];

export default function CreatePage() {
  const { connected } = useWallet();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateFormState>(INITIAL);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [metaSource, setMetaSource] = useState<"a1111" | "comfyui" | "none" | null>(null);
  const { mint, step: mintStep, error: mintError, result, reset } = useMint();

  function patch(fields: Partial<CreateFormState>) {
    setForm((f) => ({ ...f, ...fields }));
  }

  function onModelChange(modelId: string) {
    const defaults = MODEL_DEFAULTS[modelId] ?? MODEL_DEFAULTS["other"];
    patch({ aiModel: modelId, ...defaults });
  }

  function canProceed() {
    if (step === 0) return !!form.file;
    if (step === 1) return !!form.aiModel;
    if (step === 2) return !!form.tokenName && !!form.description;
    return true;
  }

  if (!connected) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: 520, margin: "120px auto", padding: "0 24px", textAlign: "center" }}>
          <h1 className="display-md" style={{ marginBottom: 16 }}>Connect Your Wallet</h1>
          <p style={{ color: "var(--mist)", fontSize: "0.9rem" }}>
            You need an Aptos wallet connected to mint NFTs with provenance on VERITAS.
          </p>
        </main>
      </>
    );
  }

  // Success screen
  if (result && mintStep === "done") {
    return (
      <>
        <Header />
        <main style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px" }}>
          <div className="v-card" style={{ padding: "40px 32px", textAlign: "center" }}>
            <CheckCircle2 size={40} style={{ color: "var(--emerald)", margin: "0 auto 20px" }} />
            <h2 className="display-md" style={{ marginBottom: 8 }}>NFT Minted</h2>
            <p style={{ color: "var(--mist)", fontSize: "0.9rem", marginBottom: 28 }}>
              Your artwork is permanently stored on Shelby and its provenance is on-chain.
            </p>

            <div className="v-card" style={{ padding: "20px", marginBottom: 20, textAlign: "left" }}>
              <div className="data-row">
                <span className="data-row-key">Proof</span>
                <ProofBadge status="verified" />
              </div>
              <div className="data-row">
                <span className="data-row-key">Merkle Root</span>
                <HashChip hash={result.upload.merkleRoot} />
              </div>
              <div className="data-row">
                <span className="data-row-key">Shelby Tx</span>
                <HashChip hash={result.upload.shelbyTxHash} label="tx" />
              </div>
              <div className="data-row">
                <span className="data-row-key">Mint Tx</span>
                <HashChip hash={result.txHash} label="tx" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://explorer.aptoslabs.com/txn/${result.txHash}?network=shelbynet`}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost"
                style={{ fontSize: "0.875rem" }}
              >
                View on Explorer <ExternalLink size={13} />
              </a>
              <button className="btn-primary" style={{ fontSize: "0.875rem" }}
                onClick={() => { reset(); setForm(INITIAL); setStep(0); }}
              >
                Mint Another
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <p className="label-xs" style={{ marginBottom: 8 }}>Create</p>
          <h1 className="display-md">Mint with Provenance</h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
          {STEP_LABELS.map((label, i) => (
            <>
              <div key={`node-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div className={`step-node${i === step ? " active" : i < step ? " done" : ""}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: i === step ? "var(--cyan)" : "var(--ghost)" }}>
                  {label.toUpperCase()}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div key={`line-${i}`} className={`step-line${i < step ? " done" : ""}`} style={{ margin: "0 8px", marginBottom: 20 }} />
              )}
            </>
          ))}
        </div>

        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="animate-fade-up">
            <p className="label-xs" style={{ marginBottom: 16 }}>Step 1 — Upload Artwork</p>
            <UploadDropzone
              file={form.file}
              previewUrl={form.filePreviewUrl}
              onFile={async (file, url) => {
                const meta = await extractImageMeta(file);
                setMetaSource(meta.source);
                if (meta.source !== "none") {
                  patch({
                    file, filePreviewUrl: url,
                    prompt:         meta.prompt         || "",
                    negativePrompt: meta.negativePrompt || "",
                    seed:           meta.seed           || randomSeed(),
                    steps:          meta.steps          || "",
                    cfgScale:       meta.cfgScale       || "",
                    sampler:        meta.sampler        || "",
                  });
                  setAdvancedOpen(true);
                  const label = meta.source === "a1111" ? "A1111 / Forge" : "ComfyUI";
                  toast.success(`Provenance auto-detected from ${label} metadata`);
                } else {
                  patch({ file, filePreviewUrl: url });
                }
              }}
              onClear={() => { patch({ file: null, filePreviewUrl: "" }); setMetaSource(null); }}
            />
          </div>
        )}

        {/* Step 1: Provenance */}
        {step === 1 && (
          <div className="animate-fade-up">
            <p className="label-xs" style={{ marginBottom: 20 }}>Step 2 — AI Provenance</p>

            {metaSource && metaSource !== "none" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--cyan-dim)", border: "1px solid var(--cyan-border)",
                borderRadius: 4, padding: "8px 12px", marginBottom: 4, fontSize: 12,
                color: "var(--cyan)",
              }}>
                <Sparkles size={13} />
                <span>
                  Fields auto-filled from{" "}
                  <strong>{metaSource === "a1111" ? "A1111 / Forge" : "ComfyUI"}</strong>{" "}
                  metadata — review and adjust below.
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* AI Model */}
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>AI Model *</label>
                <select className="v-input" value={form.aiModel} onChange={e => onModelChange(e.target.value)}>
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>

              {/* Prompt */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <label className="label-xs">Prompt</label>
                  {[
                    { label: "Cyberpunk",  value: "cyberpunk city at dusk, neon rain, cinematic lighting" },
                    { label: "Oil Paint",  value: "oil painting portrait, golden hour, impressionist" },
                    { label: "Macro",      value: "macro photograph of a dewdrop on a spider web, studio light" },
                    { label: "Low-poly",   value: "low-poly geometric landscape, pastel gradient, minimalist" },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => patch({ prompt: value })}
                      style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.03em", cursor: "pointer", lineHeight: 1.6,
                        background: "var(--wire)", border: "1px solid var(--wire-bright)",
                        color: "var(--mist)", transition: "color 120ms, border-color 120ms",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--mist)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--wire-bright)"; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea className="v-input" rows={4}
                  placeholder="Paste the exact text you entered into your AI tool, e.g. &quot;a cyberpunk city at dusk, neon rain, cinematic lighting&quot;"
                  value={form.prompt} onChange={e => patch({ prompt: e.target.value })} />
                <p style={{ fontSize: 11, color: "var(--mist)", marginTop: 5, lineHeight: 1.5 }}>
                  Optional — if left blank the NFT will be marked <span style={{ color: "var(--gold)" }}>Partial Provenance</span>.
                </p>
              </div>

              {/* Advanced Parameters accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--mist)", fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 0",
                  }}
                >
                  <ChevronDown size={13} style={{ transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }} />
                  Advanced Parameters
                </button>

                {advancedOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14, paddingLeft: 4, borderLeft: "1px solid var(--wire-bright)" }}>
                    <div>
                      <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Negative Prompt</label>
                      <textarea className="v-input" rows={2} placeholder="blurry, low quality, watermark..."
                        value={form.negativePrompt} onChange={e => patch({ negativePrompt: e.target.value })} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label className="label-xs" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          Seed
                          <button
                            type="button"
                            onClick={() => patch({ seed: randomSeed() })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyan)", fontSize: 10, padding: 0, fontFamily: "var(--font-mono)" }}
                          >
                            ↻ roll
                          </button>
                        </label>
                        <input className="v-input" type="number" value={form.seed}
                          onChange={e => patch({ seed: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Steps</label>
                        <input className="v-input" type="number" value={form.steps}
                          onChange={e => patch({ steps: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>CFG Scale</label>
                        <input className="v-input" type="number" step="0.5" value={form.cfgScale}
                          onChange={e => patch({ cfgScale: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Sampler</label>
                        <input className="v-input" placeholder="DPM++ 2M Karras" value={form.sampler}
                          onChange={e => patch({ sampler: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Generation Tool</label>
                        <select className="v-input" value={form.generationTool} onChange={e => patch({ generationTool: e.target.value })}>
                          <option value="">Select tool</option>
                          {GENERATION_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Model Version</label>
                      <input className="v-input" placeholder="e.g. 3.5-large, v6.1" value={form.aiModelVersion}
                        onChange={e => patch({ aiModelVersion: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: NFT Details */}
        {step === 2 && (
          <div className="animate-fade-up">
            <p className="label-xs" style={{ marginBottom: 20 }}>Step 3 — NFT Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Token Name *</label>
                <input className="v-input" placeholder="Nebula Genesis #001" value={form.tokenName}
                  onChange={e => patch({ tokenName: e.target.value })} />
              </div>
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Description *</label>
                <textarea className="v-input" rows={3} placeholder="Describe this artwork..."
                  value={form.description} onChange={e => patch({ description: e.target.value })} />
              </div>
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>
                  Royalty — {form.royaltyBps / 100}%
                </label>
                <input type="range" min={0} max={1500} step={50} value={form.royaltyBps}
                  onChange={e => patch({ royaltyBps: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "var(--cyan)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ghost)", marginTop: 4 }}>
                  <span>0%</span><span>15%</span>
                </div>
              </div>
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 10 }}>Access Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { value: ACCESS_PUBLIC,  label: "Free",    sub: "Anyone can view" },
                    { value: ACCESS_PAID,    label: "Paid",    sub: "Per-view fee" },
                    { value: ACCESS_PRIVATE, label: "Private", sub: "Owner only" },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => patch({ accessType: opt.value })}
                      style={{
                        background: form.accessType === opt.value ? "var(--cyan-dim)" : "var(--surface-1)",
                        border: `1px solid ${form.accessType === opt.value ? "var(--cyan-border)" : "var(--wire-bright)"}`,
                        borderRadius: 3, padding: "12px 8px", cursor: "pointer", textAlign: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: form.accessType === opt.value ? "var(--cyan)" : "var(--silver)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--mist)", marginTop: 3 }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              {form.accessType === ACCESS_PAID && (
                <div>
                  <label className="label-xs" style={{ display: "block", marginBottom: 6 }}>Price per view (Octas)</label>
                  <input className="v-input" type="number" placeholder="1000000 (= 0.01 APT)"
                    value={form.priceOctas} onChange={e => patch({ priceOctas: e.target.value })} />
                  <p style={{ fontSize: 11, color: "var(--mist)", marginTop: 4 }}>1 APT = 100,000,000 Octas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review & Mint */}
        {step === 3 && (
          <div className="animate-fade-up">
            <p className="label-xs" style={{ marginBottom: 20 }}>Step 4 — Review & Mint</p>

            {mintStep === "idle" || mintStep === "error" ? (
              <div className="v-card" style={{ padding: 20 }}>
                <div className="data-row">
                  <span className="data-row-key">Token Name</span>
                  <span className="data-row-val">{form.tokenName}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">AI Model</span>
                  <span className="data-row-val">{AI_MODELS.find(m => m.id === form.aiModel)?.label ?? form.aiModel}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">Prompt</span>
                  {form.prompt ? (
                    <span className="data-row-val" style={{ fontSize: 11, maxWidth: 280, textAlign: "right" }}>
                      {form.prompt.slice(0, 80)}{form.prompt.length > 80 ? "..." : ""}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--gold)" }}>Not provided — Partial Provenance</span>
                  )}
                </div>
                <div className="data-row">
                  <span className="data-row-key">File</span>
                  <span className="data-row-val">{form.file?.name}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">Storage</span>
                  <span className="tag-cyan" style={{ fontSize: 10, padding: "2px 6px" }}>Shelby Shelbynet</span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">Royalty</span>
                  <span className="data-row-val">{form.royaltyBps / 100}%</span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">Access</span>
                  <span className="data-row-val">
                    {form.accessType === ACCESS_PUBLIC ? "Public Free" : form.accessType === ACCESS_PAID ? "Paid" : "Private"}
                  </span>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: 20, padding: "0.75rem" }}
                  onClick={() => mint(form)}
                >
                  Encode, Upload & Mint NFT
                </button>
                {mintError && (
                  <p style={{ fontSize: 12, color: "var(--crimson)", marginTop: 10 }}>{mintError}</p>
                )}
              </div>
            ) : (
              <UploadProgress step={mintStep} error={mintError} />
            )}
          </div>
        )}

        {/* Navigation */}
        {mintStep === "idle" || mintStep === "error" ? (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36 }}>
            <button
              className="btn-ghost"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </button>
            {step < 3 && (
              <button
                className="btn-primary"
                onClick={() => {
                  if (!canProceed()) {
                    toast.error("Please complete all required fields.");
                    return;
                  }
                  setStep(s => s + 1);
                }}
              >
                Continue
              </button>
            )}
          </div>
        ) : null}
      </main>
    </>
  );
}
