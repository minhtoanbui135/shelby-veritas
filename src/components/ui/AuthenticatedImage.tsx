"use client";

import { useEffect, useState, useRef } from "react";
import { SHELBY_API_KEY } from "@/constants";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

type State = "loading" | "ok" | "unavailable" | "error";

export function AuthenticatedImage({ src, alt, style, className }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [state, setState]         = useState<State>("loading");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) { setState("error"); return; }
    setState("loading");
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src, {
          headers: SHELBY_API_KEY ? { Authorization: `Bearer ${SHELBY_API_KEY}` } : {},
        });

        if (!res.ok) { if (!cancelled) setState("error"); return; }

        const blob = await res.blob();

        // 0-byte body = Shelby can't reconstruct yet (storage providers unavailable)
        if (blob.size === 0) { if (!cancelled) setState("unavailable"); return; }

        const url = URL.createObjectURL(blob);
        if (cancelled) { URL.revokeObjectURL(url); return; }

        // Revoke previous URL before setting the new one
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setObjectUrl(url);
        setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [src]);

  // Revoke on unmount
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const placeholder = (content: React.ReactNode) => (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 6,
      background: "var(--surface-1)", ...style,
    }}>
      {content}
    </div>
  );

  if (state === "loading") return placeholder(
    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--wire-bright)", borderTopColor: "var(--cyan)", animation: "spin 0.8s linear infinite" }} />
  );

  if (state === "unavailable") return placeholder(<>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ghost)" }}>Storage pending</span>
    <span style={{ fontSize: 10, color: "var(--ghost)", opacity: 0.6 }}>Shelbynet is propagating chunks</span>
  </>);

  if (state === "error" || !objectUrl) return placeholder(
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ghost)" }}>No preview</span>
  );

  return <img src={objectUrl} alt={alt} style={style} className={className} />;
}
