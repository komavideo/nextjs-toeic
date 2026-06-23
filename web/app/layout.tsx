import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5分リーディングドリル",
  description: "短時間で Reading の弱点を継続的に潰す学習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
