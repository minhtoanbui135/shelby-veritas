"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletSelector } from "./WalletSelector";

const NAV = [
  { href: "/gallery", label: "Gallery" },
  { href: "/create",  label: "Create"  },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const path = usePathname();

  return (
    <header
      style={{
        background: "rgba(13,15,18,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--wire)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polygon
              points="11,2 20,7 20,15 11,20 2,15 2,7"
              stroke="var(--cyan)"
              strokeWidth="1.5"
              fill="rgba(0,212,255,0.08)"
            />
            <polygon
              points="11,6 16,9 16,13 11,16 6,13 6,9"
              stroke="var(--cyan)"
              strokeWidth="1"
              fill="rgba(0,212,255,0.12)"
            />
            <circle cx="11" cy="11" r="2" fill="var(--cyan)" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1.1rem",
              letterSpacing: "0.12em",
              color: "var(--silver)",
            }}
          >
            VERITAS
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {NAV.map(({ href, label }) => {
            const active = path?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 14px",
                  borderRadius: 3,
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--cyan)" : "var(--mist)",
                  background: active ? "var(--cyan-dim)" : "transparent",
                  letterSpacing: "0.03em",
                  transition: "color 150ms ease, background 150ms ease",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet */}
        <WalletSelector />
      </div>
    </header>
  );
}
