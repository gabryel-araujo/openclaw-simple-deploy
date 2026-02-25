"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { ModelButton } from "@/components/ModelButton";
import { PaymentModal } from "@/components/PaymentModal";
import { TelegramSetupModal } from "@/components/TelegramSetupModal";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { GoogleLogin } from "@react-oauth/google";
import {
  Bot,
  CheckCircle2,
  Clock3,
  Coins,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash";

const LS_MODEL_KEY = "brclaw:selected_model";
const LS_CHANNEL_KEY = "brclaw:selected_channel";
const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";
const LS_TELEGRAM_BOT_KEY = "brclaw:telegram_bot";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

export default function HomePage() {
  const OPTIONS: Array<{
    value: ModelKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "gpt-5.2",
      label: "GPT-5.2",
      icon: <AgentIcon agent="gpt" />,
    },
    {
      value: "claude-opus",
      label: "Claude Opus 4.5",
      icon: <AgentIcon agent="claude" />,
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
      value: "discord",
      label: "Discord",
      icon: <ChannelIcon channel="discord" />,
      disabled: true,
      badge: "Em breve",
    },
    {
      value: "whatsapp",
      label: "Whatsapp",
      icon: <ChannelIcon channel="whatsapp" />,
      disabled: true,
      badge: "Em breve",
    },
  ];

  const [model, setModel] = React.useState<ModelKey | null>(null);
  const [channel, setChannel] = React.useState<ChannelType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBot, setTelegramBot] = useState<BotInfo | null>(null);
  const router = useRouter();
  const comparisonRows = [
    {
      title: "Tempo de setup",
      tradicional: "Configuração manual de ambiente, deploy e testes",
      simples: "Fluxo guiado com ativação rápida",
    },
    {
      title: "Custo inicial",
      tradicional: "Maior custo em horas técnicas e retrabalho",
      simples: "Menor custo operacional",
    },
    {
      title: "Complexidade",
      tradicional: "Múltiplas etapas e chance de erro",
      simples: "Escolha modelo + canal e siga o fluxo",
    },
  ] as const;

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem(LS_MODEL_KEY) as ModelKey | null;
    const savedChannel = localStorage.getItem(
      LS_CHANNEL_KEY,
    ) as ChannelType | null;
    const savedToken = localStorage.getItem(LS_TELEGRAM_TOKEN_KEY);
    const savedBot = localStorage.getItem(LS_TELEGRAM_BOT_KEY);

    if (savedModel) setModel(savedModel);
    if (savedChannel) setChannel(savedChannel);
    if (savedToken) setTelegramToken(savedToken);
    if (savedBot) {
      try {
        setTelegramBot(JSON.parse(savedBot));
      } catch {
        // ignore corrupt data
      }
    }
  }, []);

  // Persist model selection (only when set)
  useEffect(() => {
    if (model) localStorage.setItem(LS_MODEL_KEY, model);
  }, [model]);

  // Persist channel selection (only when set)
  useEffect(() => {
    if (channel) localStorage.setItem(LS_CHANNEL_KEY, channel);
  }, [channel]);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const handleChannelChange = (value: ChannelType) => {
    setChannel(value);
  };

  const handleTelegramConfirm = (token: string, bot: BotInfo) => {
    setTelegramToken(token);
    setTelegramBot(bot);
    localStorage.setItem(LS_TELEGRAM_TOKEN_KEY, token);
    localStorage.setItem(LS_TELEGRAM_BOT_KEY, JSON.stringify(bot));
    setIsTelegramModalOpen(false);
  };

  const handleReconfigureTelegram = () => {
    setIsTelegramModalOpen(true);
  };

  const handleLoginSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    try {
      const response = await fetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        setIsLoggedIn(true);
      } else {
        console.error("Login error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // Channel is "ready" when a channel is selected, and for telegram a token is validated
  const isChannelReady =
    !!channel && (channel !== "telegram" || !!telegramToken);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-[radial-gradient(circle_at_top,#12233b_0%,#070b13_60%,#04070d_100%)] p-6 md:p-10">
        <div className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute left-8 top-10 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />
            SimpleClaw BR
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
            Faça deploy do <span className="text-cyan-400">OpenClaw</span> sem
            travar na configuração.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Em vez de gastar tempo com setup manual, infraestrutura e ajustes,
            você escolhe seu modelo, conecta o canal e inicia o deploy.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Clock3 className="h-4 w-4 text-cyan-300" />
              <p className="mt-2 text-sm font-semibold text-white">
                Ganha tempo
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Menos setup manual e menos retrabalho.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Coins className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-sm font-semibold text-white">
                Gasta menos
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Reduz custo inicial de implementação.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2 md:col-span-1">
              <Rocket className="h-4 w-4 text-violet-300" />
              <p className="mt-2 text-sm font-semibold text-white">
                Vai ao ponto
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Fluxo direto para ativação e deploy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/60 p-8 shadow-[0_0_120px_-20px_rgba(34,211,238,0.25)] backdrop-blur">
        <div className="mb-3 flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <section>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              Configure seu deploy
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Selecione o modelo e o canal. O restante do fluxo é guiado.
            </p>
          </section>
          <span className="inline-flex w-fit items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 md:shrink-0">
            Apenas 8 unidades disponíveis!
          </span>
        </div>

        {/* Model selection */}
        <section className="mt-4">
          <p className="my-4 max-w-2xl text-slate-300 font-bold">
            Qual modelo você gostaria de usar?
          </p>
          <ModelButton
            name="model-group"
            value={model ?? ""}
            onChange={(v) => setModel(v as ModelKey)}
            options={OPTIONS}
          />
        </section>

        {/* Channel selection */}
        <section>
          <p className="my-4 max-w-2xl text-slate-300 font-bold">
            Qual canal você prefere usar para mandar as mensagens?
          </p>
          <ModelButton
            name="channel-group"
            value={channel ?? ""}
            onChange={(v) => handleChannelChange(v as ChannelType)}
            options={CHATOPTIONS}
          />

          {/* Telegram: not yet configured — show configure button */}
          {channel === "telegram" && !telegramBot && (
            <div className="mt-4">
              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors"
              >
                <Bot className="h-4 w-4" />
                Configurar Bot do Telegram
              </button>
            </div>
          )}

          {/* Telegram: already configured — show badge + reconfigure */}
          {channel === "telegram" && telegramBot && (
            <div className="mt-4 inline-flex items-center gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
              <Bot className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-emerald-300 font-semibold">
                  {telegramBot.name}
                </span>
                <span className="text-emerald-400/60 ml-1">
                  @{telegramBot.username}
                </span>
              </div>
              <button
                onClick={handleReconfigureTelegram}
                className="ml-1 text-emerald-500/50 hover:text-emerald-300 transition-colors"
                title="Reconfigurar bot"
              >
                <RefreshCw className="h-3.5 w-3.5 cursor-pointer" />
              </button>
            </div>
          )}
        </section>

        {/* Login / Deploy — only shown when channel is ready */}
        {isChannelReady && (
          <section className="my-4 w-full max-w-sm">
            {!isLoggedIn ? (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Faça login para continuar com o deploy:
                </p>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Login Failed")}
                  useOneTap={true}
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Login realizado com sucesso!
                </p>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 active:scale-[0.98] shadow-[0_0_30px_rgba(34,211,238,0.3)] mt-4 cursor-pointer"
                >
                  <Rocket className="h-4 w-4" />
                  Fazer deploy
                </button>
              </div>
            )}
          </section>
        )}
      </section>

      {/* Telegram Setup Modal */}
      {isTelegramModalOpen && (
        <TelegramSetupModal
          onConfirm={handleTelegramConfirm}
          onClose={() => setIsTelegramModalOpen(false)}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          planId="pro-monthly"
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-red-300">
            Método tradicional
          </p>
          <div className="space-y-3">
            {comparisonRows.map((row) => (
              <div
                key={`tradicional-${row.title}`}
                className="rounded-xl border border-white/5 bg-black/20 p-3"
              >
                <p className="text-sm font-semibold text-white">{row.title}</p>
                <p className="mt-1 text-sm text-slate-300">{row.tradicional}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-emerald-300">
            Método SimpleClaw BR
          </p>
          <div className="space-y-3">
            {comparisonRows.map((row) => (
              <div
                key={`simples-${row.title}`}
                className="rounded-xl border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {row.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{row.simples}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
