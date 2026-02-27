"use client";

import { TelegramSetupModal } from "@/components/TelegramSetupModal";
import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon } from "@/components/ChannelIcon";
import { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Bot,
  RefreshCw,
  Settings2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ─── Types ─── */
type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash" | "llama-3.3-70b";
type ChannelType = "telegram" | "discord" | "whatsapp";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

const LS_MODEL_KEY = "brclaw:selected_model";
const LS_CHANNEL_KEY = "brclaw:selected_channel";
const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";
const LS_TELEGRAM_BOT_KEY = "brclaw:telegram_bot";

/* ─── Model & Channel labels ─── */
const MODELS: { value: ModelKey; label: string; icon: React.ReactNode }[] = [
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

const CHANNELS: {
  value: ChannelType;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}[] = [
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
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: <ChannelIcon channel="whatsapp" />,
    disabled: true,
  },
];

/* ─── Small reusable toggle ─── */
function FutureToggle({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-800/50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Em breve
        </span>
        {/* Disabled toggle */}
        <button
          disabled
          aria-label={label}
          className="relative w-10 h-5 rounded-full bg-slate-800 border border-slate-700 cursor-not-allowed opacity-40"
        >
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-slate-600 transition-transform" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function SettingsPage({ user: _user }: { user: User }) {
  const [model, setModel] = useState<ModelKey | null>(null);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [telegramBot, setTelegramBot] = useState<BotInfo | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  /* Load from localStorage */
  useEffect(() => {
    try {
      const m = localStorage.getItem(LS_MODEL_KEY) as ModelKey | null;
      const c = localStorage.getItem(LS_CHANNEL_KEY) as ChannelType | null;
      const b = localStorage.getItem(LS_TELEGRAM_BOT_KEY);
      if (m) setModel(m);
      if (c) setChannel(c);
      if (b) {
        try {
          setTelegramBot(JSON.parse(b));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* SSR guard */
    }
  }, []);

  const saveModel = (v: ModelKey) => {
    setModel(v);
    localStorage.setItem(LS_MODEL_KEY, v);
    toast.success("Modelo salvo!");
  };

  const saveChannel = (v: ChannelType) => {
    setChannel(v);
    localStorage.setItem(LS_CHANNEL_KEY, v);
    toast.success("Canal salvo!");
  };

  const handleTelegramConfirm = (token: string, bot: BotInfo) => {
    setTelegramBot(bot);
    localStorage.setItem(LS_TELEGRAM_TOKEN_KEY, token);
    localStorage.setItem(LS_TELEGRAM_BOT_KEY, JSON.stringify(bot));
    setIsTelegramModalOpen(false);
    toast.success(`Bot @${bot.username} configurado!`);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* ── 1. Agent Preferences ── */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/15">
            <Settings2 className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Preferências do Agente
          </h2>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Modelo padrão
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => saveModel(m.value)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  model === m.value
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.08)]"
                    : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  {m.icon}
                </span>
                {m.label}
                {model === m.value && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Canal padrão
          </p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => !c.disabled && saveChannel(c.value)}
                disabled={c.disabled}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  c.disabled
                    ? "cursor-not-allowed border-slate-800/50 text-slate-600"
                    : channel === c.value
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  {c.icon}
                </span>
                {c.label}
                {c.disabled && (
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
                    Em breve
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Integrations ── */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/15">
            <Zap className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Integrações
          </h2>
        </div>

        {/* Telegram */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 ring-1 ring-sky-500/20">
                <ChannelIcon channel="telegram" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Telegram</p>
                {telegramBot ? (
                  <p className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-medium">
                      {telegramBot.name}
                    </span>{" "}
                    <span className="text-slate-500">
                      @{telegramBot.username}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Não configurado</p>
                )}
              </div>

              {telegramBot && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  <Bot className="h-3 w-3" />
                  Conectado
                </span>
              )}
            </div>

            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {telegramBot ? "Reconfigurar" : "Configurar"}
            </button>
          </div>
        </div>

        {/* Discord — coming soon */}
        <div className="rounded-xl border border-slate-800/40 bg-slate-950/20 p-4 opacity-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20">
                <ChannelIcon channel="discord" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Discord</p>
                <p className="text-xs text-slate-500">Em breve</p>
              </div>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-500">
              Em breve
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. Notifications (placeholder) ── */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/15">
            <Bell className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Notificações
          </h2>
        </div>

        <div className="space-y-4">
          <FutureToggle
            label="Notificações por email"
            description="Receba alertas de status e deploys por email."
          />
          <div className="border-t border-slate-800/50" />
          <FutureToggle
            label="Alertas de falha no deploy"
            description="Seja notificado imediatamente quando um deploy falhar."
          />
          <div className="border-t border-slate-800/50" />
          <FutureToggle
            label="Resumo semanal"
            description="Relatório semanal com métricas dos seus agentes."
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
          <BellOff className="h-3 w-3" />
          As notificações estarão disponíveis em uma versão futura.
        </div>
      </section>

      {/* ── 4. Danger Zone ── */}
      <section className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Zona de perigo
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-300">
              Redefinir configurações
            </p>
            <p className="text-xs text-red-400/60 mt-0.5">
              Limpa modelo, canal e token do Telegram salvos localmente.
            </p>
          </div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Deseja redefinir todas as preferências salvas?"
                )
              ) {
                localStorage.removeItem(LS_MODEL_KEY);
                localStorage.removeItem(LS_CHANNEL_KEY);
                localStorage.removeItem(LS_TELEGRAM_TOKEN_KEY);
                localStorage.removeItem(LS_TELEGRAM_BOT_KEY);
                setModel(null);
                setChannel(null);
                setTelegramBot(null);
                toast.success("Preferências redefinidas.");
              }
            }}
            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            Redefinir preferências
          </button>
        </div>
      </section>

      {/* Telegram Modal */}
      {isTelegramModalOpen && (
        <TelegramSetupModal
          onConfirm={handleTelegramConfirm}
          onClose={() => setIsTelegramModalOpen(false)}
        />
      )}
    </div>
  );
}
