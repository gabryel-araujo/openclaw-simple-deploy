import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SimpleClaw BR",
  description: "Deploy 1-click de agentes OpenClaw no Brasil",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GoogleOAuthProvider clientId="634986328338-8icol9gqrn3n6p39ifi7avevi041e904.apps.googleusercontent.com">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0f172a",
                color: "#e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.15)",
                borderRadius: "12px",
                fontSize: "14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              },
              success: {
                iconTheme: {
                  primary: "#22d3ee",
                  secondary: "#0f172a",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f87171",
                  secondary: "#0f172a",
                },
              },
            }}
          />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
