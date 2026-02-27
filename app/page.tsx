"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { LandingFooter } from "@/components/LandingFooter";
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

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash" | "llama-3.3-70b";

const LS_MODEL_KEY = "brclaw:selected_model";
const LS_CHANNEL_KEY = "brclaw:selected_channel";
const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";
const LS_TELEGRAM_BOT_KEY = "brclaw:telegram_bot";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

/* ─── Marquee chip types ─── */
type ChipColor =
  | "cyan"
  | "violet"
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "zinc";

interface MarqueeChip {
  icon: React.ReactNode;
  label: string;
  color: ChipColor;
}

const CHIP_STYLES: Record<ChipColor, string> = {
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  zinc: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
};

function MarqueeChipItem({ chip }: { chip: MarqueeChip }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mx-3 shrink-0 ${CHIP_STYLES["cyan"]}`}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {chip.icon}
      </span>
      {chip.label}
    </div>
  );
}

function MarqueeRow({
  chips,
  reverse = false,
}: {
  chips: MarqueeChip[];
  reverse?: boolean;
}) {
  const doubled = [...chips, ...chips];
  return (
    <div className="overflow-hidden w-full">
      <div className={reverse ? "marquee-track-reverse" : "marquee-track"}>
        {doubled.map((chip, i) => (
          <MarqueeChipItem key={i} chip={chip} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const OPTIONS: Array<{
    value: ModelKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "gpt-5.2", label: "GPT-5.2", icon: <AgentIcon agent="gpt" /> },
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
    {
      value: "llama-3.3-70b",
      label: "Llama 3.3 70B",
      icon: <AgentIcon agent="llama" />,
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
      icon: Clock3,
      title: "Tempo de setup",
      tradicional: {
        text: "Horas ou dias",
        detail: "Config. manual de ambiente, CI/CD e infra",
      },
      simples: {
        text: "Menos de 5 min",
        detail: "Fluxo guiado do início ao deploy",
      },
    },
    {
      icon: Coins,
      title: "Custo inicial",
      tradicional: {
        text: "Alto",
        detail: "Horas técnicas, retrabalho e infraestrutura",
      },
      simples: {
        text: "Baixo",
        detail: "Sem servidores para configurar manualmente",
      },
    },
    {
      icon: RefreshCw,
      title: "Complexidade",
      tradicional: {
        text: "Muito alta",
        detail: "Múltiplas etapas com risco de falha",
      },
      simples: {
        text: "Mínima",
        detail: "Escolha modelo + canal e siga o fluxo",
      },
    },
    {
      icon: Rocket,
      title: "Deploy",
      tradicional: {
        text: "Manual",
        detail: "Scripts, Dockerfiles e cloud providers",
      },
      simples: {
        text: "1 clique",
        detail: "Railway + OpenClaw configurados automaticamente",
      },
    },
  ];

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

  /* ── Marquee data (defined here so JSX icons resolve in component scope) ── */
  const ROW_ONE: MarqueeChip[] = [
    { icon: <AgentIcon agent="gpt" />, label: "GPT-5.2", color: "emerald" },
    {
      icon: <AgentIcon agent="claude" />,
      label: "Claude Opus 4.5",
      color: "violet",
    },
    {
      icon: <AgentIcon agent="gemini" />,
      label: "Gemini Flash",
      color: "cyan",
    },
    {
      icon: <AgentIcon agent="llama" />,
      label: "Llama 3.3 70B",
      color: "amber",
    },
    {
      icon: <ChannelIcon channel="telegram" />,
      label: "Telegram",
      color: "sky",
    },
    {
      icon: <Bot className="h-4 w-4" />,
      label: "Deploy 1-click",
      color: "rose",
    },
    {
      icon: <Rocket className="h-4 w-4" />,
      label: "Infraestrutura gerenciada",
      color: "cyan",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Setup guiado",
      color: "emerald",
    },
  ];

  const ROW_TWO: MarqueeChip[] = [
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: "Ativação rápida",
      color: "cyan",
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: "Menor custo operacional",
      color: "emerald",
    },
    { icon: <AgentIcon agent="gpt" />, label: "GPT-5.2", color: "amber" },
    {
      icon: <ChannelIcon channel="discord" />,
      label: "Discord (em breve)",
      color: "violet",
    },
    {
      icon: <ChannelIcon channel="whatsapp" />,
      label: "WhatsApp (em breve)",
      color: "emerald",
    },
    {
      icon: <AgentIcon agent="claude" />,
      label: "Claude Opus 4.5",
      color: "rose",
    },
    {
      icon: <Bot className="h-4 w-4" />,
      label: "Bot configurado",
      color: "sky",
    },
    { icon: <Rocket className="h-4 w-4" />, label: "OpenClaw", color: "cyan" },
  ];

  return (
    <>
      {/*UpperSection card */}
      <div className="relative w-full rounded-b-[2.5rem] overflow-hidden border border-t-0 border-slate-800/60 bg-[radial-gradient(ellipse_100%_80%_at_50%_-5%,#0e2235_0%,#060a10_55%,#030508_100%)] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9),0_8px_32px_-8px_rgba(34,211,238,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* ── Announcement bar ── */}
        <div className="flex items-center justify-center gap-2 border-b border-slate-800/50 bg-linear-to-r from-cyan-950/0 via-cyan-900/20 to-cyan-950/0 px-4 py-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
          <p className="text-[11px] font-semibold tracking-[0.12em] text-cyan-300/80 uppercase">
            Deploy de Agentes OpenClaw &middot; 1-Click &middot; Infraestrutura
            Gerenciada
          </p>
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
        </div>

        {/* ── Ambient glow blobs ── */}
        <div className="pointer-events-none absolute -top-10 left-1/4 h-96 w-96 rounded-full bg-cyan-500/6 blur-[100px]" />
        <div className="pointer-events-none absolute top-20 right-1/4 h-64 w-64 rounded-full bg-indigo-500/6 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-10 left-1/2 h-40 w-[500px] -translate-x-1/2 rounded-full bg-cyan-400/6 blur-[60px]" />

        {/* ── Subtle noise texture ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-8 pb-10 md:pt-12">
          {/* ── Hero ── */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-[radial-gradient(circle_at_top,#12233b_0%,#070b13_60%,#04070d_100%)] p-6 md:p-10">
            <div className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute left-8 top-10 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />

            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />
                  Simpleclaw Sync
                </div>
              </div>

              <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
                Faça deploy do <span className="text-cyan-400">OpenClaw</span>{" "}
                sem travar na configuração.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                Em vez de gastar tempo com setup manual, infraestrutura e
                ajustes, você escolhe seu modelo, conecta o canal e inicia o
                deploy.
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

          {/* ── Configure seu deploy ── */}
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
        </div>
      </div>
      {/* ── Marquee strip – full viewport width ── */}
      <section
        className="marquee-root relative w-full overflow-hidden py-5 cursor-default select-none mt-8"
        aria-hidden="true"
      >
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 " />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 " />

        <div className="flex flex-col gap-3">
          <MarqueeRow chips={ROW_ONE} />
          <MarqueeRow chips={ROW_TWO} reverse />
        </div>
      </section>

      {/* Lower Section */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-10 pb-0 md:pt-14">
        {/* ── Comparison ── */}
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
            <div className="flex items-center gap-2.5 border-b border-slate-800/60 bg-red-950/20 px-6 py-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                ✕
              </span>
              <span className="text-sm font-semibold text-red-300 uppercase tracking-wider">
                Método tradicional
              </span>
            </div>
            <div className="w-px bg-slate-800/60" />
            <div className="flex items-center gap-2.5 border-b border-slate-800/60 bg-emerald-950/20 px-6 py-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                ✓
              </span>
              <span className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                Simpleclaw Sync
              </span>
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={row.title}
                className={`grid grid-cols-[1fr_auto_1fr] items-stretch ${
                  i < comparisonRows.length - 1
                    ? "border-b border-slate-800/40"
                    : ""
                }`}
              >
                {/* Traditional side */}
                <div className="flex flex-col justify-center gap-1.5 bg-red-950/10 px-6 py-5 hover:bg-red-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {row.title}
                    </span>
                  </div>
                  <span className="text-base font-bold text-red-300">
                    {row.tradicional.text}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {row.tradicional.detail}
                  </span>
                </div>

                {/* Divider with icon */}
                <div className="flex flex-col items-center justify-center w-14 border-x border-slate-800/40 bg-slate-950/60 gap-1 py-3">
                  <Icon className="h-4 w-4 text-slate-600" />
                  <div className="h-3 w-px bg-slate-800" />
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500/50" />
                </div>

                {/* Simpleclaw side */}
                <div className="flex flex-col justify-center gap-1.5 bg-emerald-950/10 px-6 py-5 hover:bg-emerald-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">
                      {row.title}
                    </span>
                  </div>
                  <span className="text-base font-bold text-emerald-300">
                    {row.simples.text}
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    {row.simples.detail}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Footer CTA */}
          <div className="border-t border-slate-800/60 bg-linear-to-r from-red-950/10 via-slate-950/60 to-emerald-950/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              Economize tempo, reduza riscos e coloque seu agente no ar hoje
              mesmo.
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Rocket className="h-3 w-3" />
              Deploy 1-click disponível agora
            </span>
          </div>
        </section>

        {/* ── Login / Acesse seus agentes ── */}
        {!isLoggedIn && (
          <section className="login-card-border animate-fadeIn">
            <div className="login-card-inner relative px-6 py-12 md:py-16 flex flex-col items-center text-center gap-6 overflow-hidden">
              {/* Glow blob */}
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-40 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

              {/* Badge */}
              <span className="relative inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Acesso restrito
              </span>

              <div className="relative">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Acesse seus <span className="text-cyan-400">agentes</span>
                </h2>
                <p className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed">
                  Entre com sua conta Google para gerenciar seus agentes
                  implantados, acompanhar métricas e configurar integrações.
                </p>
              </div>

              {/* Feature pills */}
              <div className="relative flex flex-wrap justify-center gap-2 text-xs">
                {[
                  { icon: "🤖", text: "Gerencie agentes" },
                  { icon: "📊", text: "Métricas em tempo real" },
                  { icon: "⚙️", text: "Configurações avançadas" },
                ].map((f) => (
                  <span
                    key={f.text}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/50 px-3 py-1 text-slate-300"
                  >
                    {f.icon} {f.text}
                  </span>
                ))}
              </div>

              {/* Google login button */}
              <div className="relative flex flex-col items-center gap-3">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Login Failed")}
                  useOneTap={false}
                  size="large"
                  shape="pill"
                  text="signin_with"
                />
                <p className="text-[11px] text-slate-600">
                  Apenas contas autorizadas têm acesso ao painel.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Logged in → quick access ── */}
        {isLoggedIn && (
          <section className="login-card-border animate-fadeIn">
            <div className="login-card-inner px-6 py-10 flex flex-col items-center text-center gap-4">
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Sessão ativa
              </p>
              <h2 className="text-xl font-bold text-white">
                Bem-vindo de volta!
              </h2>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-8 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 active:scale-[0.98] shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              >
                <Rocket className="h-4 w-4" />
                Ir para o Dashboard
              </button>
            </div>
          </section>
        )}
      </div>
      <LandingFooter />
    </>
  );
}
