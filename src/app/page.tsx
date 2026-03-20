import Link from "next/link";
import { Header } from "@/components/Header";
import { ShieldCheck, Layers, Cpu, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section
          style={{
            minHeight: "calc(100vh - 60px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Decorative concentric rings */}
          <div
            aria-hidden
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", overflow: "hidden" }}
          >
            <svg width="600" height="600" viewBox="0 0 600 600" style={{ opacity: 0.04 }}>
              {[60, 120, 180, 240, 300].map((r, i) => (
                <circle key={i} cx="300" cy="300" r={r} fill="none" stroke="var(--cyan)" strokeWidth="1" />
              ))}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                return (
                  <line key={i}
                    x1={300} y1={300}
                    x2={300 + Math.cos(angle) * 300}
                    y2={300 + Math.sin(angle) * 300}
                    stroke="var(--cyan)" strokeWidth="0.5"
                  />
                );
              })}
            </svg>
          </div>

          <div style={{ position: "relative", maxWidth: 720 }}>
            <div className="animate-fade-up stagger-1" style={{ marginBottom: 20 }}>
              <span className="label-xs" style={{ color: "var(--cyan)", letterSpacing: "0.2em" }}>
                Shelby Protocol · Aptos · Verifiable Storage
              </span>
            </div>

            <h1 className="display-xl animate-fade-up stagger-2">
              ART WITH
              <br />
              <span style={{ color: "var(--cyan)" }}>PROOF.</span>
            </h1>

            <p
              className="animate-fade-up stagger-3"
              style={{ fontSize: "1.05rem", color: "var(--mist)", marginTop: 28, lineHeight: 1.7, maxWidth: 520, margin: "28px auto 0" }}
            >
              AI-generated art with embedded cryptographic provenance.
              Every piece carries an on-chain merkle root proving its origin,
              stored permanently on Shelby Protocol.
            </p>

            <div
              className="animate-fade-up stagger-4"
              style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}
            >
              <Link href="/create" className="btn-primary" style={{ fontSize: "0.9rem", padding: "0.75rem 2rem" }}>
                Mint Your Art <ArrowRight size={15} />
              </Link>
              <Link href="/gallery" className="btn-ghost" style={{ fontSize: "0.9rem", padding: "0.75rem 2rem" }}>
                Explore Gallery
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="label-xs" style={{ marginBottom: 10 }}>Why VERITAS</p>
            <h2 className="display-lg">Trust, embedded in every pixel.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              {
                icon: <ShieldCheck size={20} style={{ color: "var(--cyan)" }} />,
                title: "Cryptographic Provenance",
                body: "Every NFT carries a Shelby merkle root — a SHA-256 commitment of the asset, registered on-chain at mint time. Verify integrity in one click.",
              },
              {
                icon: <Layers size={20} style={{ color: "var(--gold)" }} />,
                title: "Permanent Storage",
                body: "Assets stored on Shelby Protocol: erasure-coded across 16 storage providers (10 data + 6 parity). Not IPFS. Not a CDN. Verifiable and permanent.",
              },
              {
                icon: <Cpu size={20} style={{ color: "var(--emerald)" }} />,
                title: "AI Provenance On-Chain",
                body: "The AI model, prompt, seed, and tool are embedded in the NFT metadata — committed to Shelby. No more anonymous AI art.",
              },
            ].map((f, i) => (
              <div key={i} className={`v-card animate-fade-up stagger-${i + 5}`} style={{ padding: "28px 24px" }}>
                <div style={{ marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--silver)", marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--mist)", lineHeight: 1.65 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "0 24px 100px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="label-xs" style={{ marginBottom: 10 }}>Process</p>
            <h2 className="display-md">Four steps to verified art.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "var(--wire)" }}>
            {[
              { n: "01", label: "Upload",   desc: "Drop your AI artwork. We detect format and prepare for Shelby encoding." },
              { n: "02", label: "Encode",   desc: "Shelby SDK computes erasure-coded merkle root commitment locally." },
              { n: "03", label: "Register", desc: "Commit the merkle root to Aptos — immutable proof of asset existence." },
              { n: "04", label: "Mint",     desc: "NFT minted with full provenance record embedded on-chain." },
            ].map((s) => (
              <div key={s.n} style={{ background: "var(--surface-1)", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ghost)" }}>{s.n}</span>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--silver)" }}>{s.label}</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--mist)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--wire)", padding: "28px 24px", display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ghost)" }}>
            VERITAS · Built on Shelby Protocol + Aptos · Shelbynet
          </span>
        </footer>
      </main>
    </>
  );
}
