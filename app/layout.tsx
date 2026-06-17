import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IEM Cologne 2026 · CS2",
  description: "Live CS2 match tracker — IEM Cologne 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
        }}>
          <a href="/matches" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>
              Breaking Point
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, background: "#3b1f5e",
              color: "var(--purple)", border: "1px solid var(--purple)",
              borderRadius: 4, padding: "1px 7px",
            }}>CS2</span>
          </a>
        </header>
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
