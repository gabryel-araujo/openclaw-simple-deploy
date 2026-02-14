"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { ModelButton } from "@/components/ModelButton";
import { createClient } from "@/src/infrastructure/auth/client";
import Link from "next/link";
import React from "react";

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


        {/* <div className="mt-8 flex gap-3">
          <Link
          href="/dashboard"
          className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-cyan-300"
          >
          <p className="text-slate-900">Ir para Dashboard</p>
          </Link>
          </div> */}
          <section className="my-4">
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
                  },
                });
              }}
              className="inline-flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:text-gray-700 hover:cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="mb-0.5 text-slate-900">Entrar com Google</span>
            </button>
          </section>
      </section>
    </main>
  );
}
