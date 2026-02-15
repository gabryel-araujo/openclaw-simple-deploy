"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { ModelButton } from "@/components/ModelButton";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash";

export default function HomePage() {
  const OPTIONS: Array<{
    value: ModelKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "claude-opus",
      label: "Claude Opus 4.5",
      icon: <AgentIcon agent="claude" />,
    },
    {
      value: "gpt-5.2",
      label: "GPT-5.2",
      icon: <AgentIcon agent="gpt" />,
    },
    {
      value: "gemini-flash",
      label: "Gemini Flash",
      icon: <AgentIcon agent="gemini" />,
    },
  ];

  const CHATOPTIONS: Array<{
    value: ChannelType;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    badge?: string;
  }> = [
    {
      value: "telegram",
      label: "Telegram",
      icon: <ChannelIcon channel="telegram" />,
    },
    {
      value: "whatsapp",
      label: "Whatsapp",
      icon: <ChannelIcon channel="whatsapp" />,
      disabled: true,
      badge: "Em breve",
    },
    {
      value: "discord",
      label: "Discord",
      icon: <ChannelIcon channel="discord" />,
      disabled: true,
      badge: "Em breve",
    },
  ];

  const [model, setModel] = React.useState<ModelKey>("claude-opus");
  const [channel, setChannel] = React.useState<ChannelType>("telegram");
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // User is already logged in, redirect to dashboard
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="mx-auto flex flex-col min-h-screen max-w-5xl items-center px-6 py-16 justify-center">
      <section>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl text-center">
          Deploy 1-click do OpenClaw para o mercado brasileiro
        </h1>
        <p className="text-center text-slate-400 my-4">
          Fuja da complexidade e faça o deploy da sua instancia do OpenClaw em
          menos de 1 minuto.
        </p>
      </section>
      <section className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/60 p-8 shadow-[0_0_120px_-20px_rgba(34,211,238,0.35)] backdrop-blur">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">
          SimpleClaw BR
        </p>

        <section>
          <p className="my-4 max-w-2xl text-slate-300 font-bold">
            Qual modelo você gostaria de usar?
          </p>

          <ModelButton value={model} onChange={setModel} options={OPTIONS} />
        </section>

        <section>
          <p className="my-4 max-w-2xl text-slate-300 font-bold">
            Qual canal você prefere usar para mandar as mensagens?
          </p>

          <ModelButton
            value={channel}
            onChange={setChannel}
            options={CHATOPTIONS}
          />
        </section>
        <section className="my-4 w-xs">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              console.log(credentialResponse);
              try {
                const response = await fetch("/auth/signin", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: credentialResponse.credential,
                  }),
                });

                const data = await response.json();

                if (response.ok) {
                  console.log("Login successful:", data);
                  // Redirect to dashboard on success
                  window.location.href = "/dashboard";
                } else {
                  console.error("Login error:", data.error);
                }
              } catch (error) {
                console.error("Fetch error:", error);
              }
            }}
            onError={() => {
              console.log("Login Failed");
            }}
            useOneTap={true}
          />
        </section>
      </section>
    </main>
  );
}
