import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Call Monitoring & Emotion Intelligence",
  description: "AI-powered call monitoring system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
