import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  title: "SimpleClaw BR",
  description: "Deploy 1-click de agentes OpenClaw no Brasil"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <GoogleOAuthProvider clientId="634986328338-8icol9gqrn3n6p39ifi7avevi041e904.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
