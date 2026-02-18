"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { ModelButton } from "@/components/ModelButton";
import { PaymentModal } from "@/components/PaymentModal";
import { TelegramSetupModal } from "@/components/TelegramSetupModal";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { GoogleLogin } from "@react-oauth/google";
import { Bot, RefreshCw, Rocket } from "lucide-react";
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

  const [model, setModel] = React.useState<ModelKey | null>(null);
  const [channel, setChannel] = React.useState<ChannelType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBot, setTelegramBot] = useState<BotInfo | null>(null);
  const router = useRouter();

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem(LS_MODEL_KEY) as ModelKey | null;
    const savedChannel = localStorage.getItem(LS_CHANNEL_KEY) as ChannelType | null;
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

        {/* Model selection */}
        <section>
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
              <Bot className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-emerald-300 font-semibold">{telegramBot.name}</span>
                <span className="text-emerald-400/60 ml-1">@{telegramBot.username}</span>
              </div>
              <button
                onClick={handleReconfigureTelegram}
                className="ml-1 text-emerald-500/50 hover:text-emerald-300 transition-colors"
                title="Reconfigurar bot"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </section>

        {/* Login / Deploy — only shown when channel is ready */}
        {isChannelReady && (
          <section className="my-4 w-xs">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Faça login para continuar com o deploy:
                </p>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Login Failed")}
                  useOneTap={true}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Login realizado com sucesso!
                </p>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 active:scale-[0.98] shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                >
                  <Rocket className="h-4 w-4" />
                  Fazer Deploy
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
    </main>
  );
}
