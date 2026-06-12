import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 월드컵 대한민국 승부예측",
  description: "UX 팀 대항전 · 대한민국 조별리그 3경기 스코어 예측",
};

export const viewport: Viewport = {
  themeColor: "#06112B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
