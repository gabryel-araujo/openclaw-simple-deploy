import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimpleClaw BR",
  description: "Deploy 1-click de agentes OpenClaw no Brasil"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
