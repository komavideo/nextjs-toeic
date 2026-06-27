import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/shared/AppShell";
import "./globals.css";

const siteUrl = "https://toeic.komavideo.com";
const siteTitle = "5分リーディングドリル";
const siteDescription =
  "短時間のReading演習、即時解説、復習予定で弱点を継続的に潰す学習アプリ";
const ogImagePath = "/og-image.jpg";
const ogImageAlt =
  "5分リーディングドリルの学習ダッシュボードと短時間Reading学習の訴求";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  applicationName: siteTitle,
  description: siteDescription,
  keywords: ["Reading 学習", "リーディング演習", "短時間学習", "復習", "英語学習"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: ogImagePath,
        alt: ogImageAlt,
      },
    ],
  },
};

// アドレスバーなどのテーマカラー（ブランドの青緑）
export const viewport: Viewport = {
  themeColor: "#176B87",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
