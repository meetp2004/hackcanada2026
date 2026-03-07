import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MapleEstate AI — Canadian Real Estate Intelligence",
  description: "Live insights into housing supply, pricing trends, and market momentum powered by AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
