import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IEM Cologne 2026 · CS2 Live",
  description: "Live CS2 match tracker — IEM Cologne 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <a href="/matches" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>IEM Cologne 2026</span>
            <span
              style={{
                fontSize: 11,
                background: "#1f3a2a",
                color: "var(--live)",
                border: "1px solid var(--live)",
                borderRadius: 4,
                padding: "1px 6px",
                fontWeight: 600,
              }}
            >
              CS2
            </span>
          </a>
        </header>
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
