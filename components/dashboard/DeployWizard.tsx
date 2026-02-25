"use client";

import { DeployModal } from "@/components/dashboard/DeployModal";
import { ChannelType } from "@/components/ChannelIcon";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import { Bot, Key, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

interface DeployWizardProps {
  user: User;
  model: ModelKey | null;
  channel: ChannelType | null;
  telegramToken: string | null;
  telegramBot: BotInfo | null;
}

const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";

/** Map front-end model keys to the API model values + provider */
const MODEL_MAP: Record<
  ModelKey,
  { apiModel: string; provider: "openai" | "anthropic" }
> = {
  "gpt-5.2": { apiModel: "gpt-4o", provider: "openai" },
  "claude-opus": { apiModel: "claude-3.5-opus", provider: "anthropic" },
  "gemini-flash": { apiModel: "gpt-4o", provider: "openai" }, // fallback
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function throwIfNotOk(response: Response) {
  if (response.ok) return;
  const data = (await parseJson(response)) as { error?: string };
  throw new Error(
    data?.error ?? `Request failed with status ${response.status}`,
  );
}

export function DeployWizard({
  user,
  model,
  channel,
  telegramToken,
  telegramBot,
}: DeployWizardProps) {
  const [apiKey, setApiKey] = useState("");
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const derived = model ? MODEL_MAP[model] : null;
  const botToken = telegramToken ?? "";
  const agentName = telegramBot
    ? `${telegramBot.name} (SimpleClaw)`
    : "Meu agente OpenClaw";

  // Load saved Telegram token
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_TELEGRAM_TOKEN_KEY) ?? "";
      if (saved && !botToken) {
        // Already handled by parent
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-detect telegram user
  async function autoDetectUser() {
    if (!botToken.trim()) return;
    setAutoDetecting(true);
    try {
      const res = await fetch("/api/telegram/resolve-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: botToken.trim() }),
      });
      await throwIfNotOk(res);
      const data = (await parseJson(res)) as {
        chatId: string;
        userId: string | null;
      };
      if (!data.userId) {
        throw new Error(
          "Não encontramos um usuário. Envie /start para o bot no Telegram e tente novamente.",
        );
      }
      setTelegramUserId(String(data.userId));
      setTelegramChatId(data.chatId ? String(data.chatId) : null);
      toast.success("Usuário do Telegram detectado automaticamente!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao detectar usuário.");
    } finally {
      setAutoDetecting(false);
    }
  }

  async function ensureFreshSession() {
    const supabase = createClient();
    await supabase.auth.getSession();
  }

  const isReady =
    !!model &&
    !!channel &&
    apiKey.trim().length >= 10 &&
    botToken.trim().length >= 10 &&
    telegramUserId.trim().length >= 2;

  function handleStartDeploy() {
    if (!isReady || !derived) {
      toast.error("Preencha todos os campos obrigatórios antes de iniciar.");
      return;
    }
    ensureFreshSession();
    setShowDeployModal(true);
  }

  return (
    <>
      <section
        className="glass rounded-2xl p-6 animate-slideUp"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3">
              <Rocket className="h-3 w-3" />
              Deploy 1-click
            </div>
            <h2 className="text-lg font-semibold text-white">
              Finalize e publique seu agente
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Informe sua API key e o chat ID para iniciar o deploy.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Secrets criptografadas
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* API Key */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                API Key (BYOK)
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Provider:{" "}
                  <span className="text-cyan-300 font-medium">
                    {derived?.provider ?? "—"}
                  </span>
                </label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Cole sua API key aqui"
                  type="password"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Telegram Chat ID */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Telegram
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  User ID (Allowlist)
                </label>
                <div className="flex gap-2">
                  <input
                    value={telegramUserId}
                    onChange={(e) => setTelegramUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="Ex: 123456789"
                  />
                  <button
                    type="button"
                    onClick={autoDetectUser}
                    disabled={autoDetecting || !botToken.trim()}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {autoDetecting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ...
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5" />
                        Detectar
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Envie uma mensagem ao bot no Telegram e clique em "Detectar".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deploy button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleStartDeploy}
            disabled={!isReady}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Iniciar Deploy
          </button>
        </div>
      </section>

      {/* Deploy Modal */}
      {showDeployModal && derived && (
        <DeployModal
          config={{
            agentName,
            model: derived.apiModel,
            provider: derived.provider,
            apiKey: apiKey.trim(),
            telegramBotToken: botToken.trim(),
            telegramUserId: telegramUserId.trim(),
            telegramChatId: telegramChatId?.trim() || undefined,
          }}
          userId={user.id}
          onComplete={() => {
            setShowDeployModal(false);
            toast.success(
              "Deploy concluído! Seu agente está sendo inicializado.",
              { duration: 6000 },
            );
          }}
          onError={(msg) => {
            setShowDeployModal(false);
            toast.error(msg, { duration: 6000 });
          }}
        />
      )}
    </>
  );
}
