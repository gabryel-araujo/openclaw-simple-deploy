"use client";

import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import { Bot, Loader2, Rocket, ShieldCheck, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Provider = "openai" | "anthropic";

type AgentListItem = {
  id: string;
  name: string;
  model: string;
  channel: string;
  status: string;
  railwayServiceId: string | null;
};

type CreateAgentResponse = { agent: AgentListItem };
type ConfigureAgentResponse = { agent: AgentListItem };
type DeployAgentResponse = { agent: AgentListItem; deploymentId: string };
type FinalizeAgentResponse = { agent: AgentListItem };
type ApiErrorResponse = { error: string };

const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";
const LS_TELEGRAM_BOT_KEY = "brclaw:telegram_bot";

const MODEL_PRESETS = [
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" as const },
  {
    value: "claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic" as const,
  },
  {
    value: "claude-3.5-opus",
    label: "Claude 3.5 Opus",
    provider: "anthropic" as const,
  },
] as const;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function throwIfNotOk(response: Response) {
  if (response.ok) return;
  const data = await parseJson<ApiErrorResponse>(response);
  throw new Error(data?.error ?? `Request failed with status ${response.status}`);
}

export function DeployWizard({ user }: { user: User }) {
  const [agentName, setAgentName] = useState("Meu agente OpenClaw");
  const [model, setModel] = useState<(typeof MODEL_PRESETS)[number]["value"]>(
    MODEL_PRESETS[0].value,
  );
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");

  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramBotLabel, setTelegramBotLabel] = useState<string | null>(null);
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [autoDetectingChat, setAutoDetectingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isReady =
    agentName.trim().length >= 2 &&
    apiKey.trim().length >= 10 &&
    telegramBotToken.trim().length >= 10 &&
    telegramUserId.trim().length >= 2;

  const headerUserId = useMemo(() => ({ "x-user-id": user.id }), [user.id]);
  const availableModels = MODEL_PRESETS.filter((preset) => preset.provider === provider);

  useEffect(() => {
    const fallbackModel = availableModels[0]?.value;
    if (fallbackModel && !availableModels.some((preset) => preset.value === model)) {
      setModel(fallbackModel);
    }
  }, [availableModels, model]);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(LS_TELEGRAM_TOKEN_KEY) ?? "";
      if (savedToken) setTelegramBotToken(savedToken);

      const savedBot = localStorage.getItem(LS_TELEGRAM_BOT_KEY);
      if (savedBot) {
        const parsed = JSON.parse(savedBot) as { name?: string; username?: string };
        const label = [parsed.name, parsed.username ? `@${parsed.username}` : null]
          .filter(Boolean)
          .join(" ");
        if (label) setTelegramBotLabel(label);
      }
    } catch {
      // ignore
    }
  }, []);

  async function autoDetectTelegramUser() {
    if (!telegramBotToken.trim()) return;
    setAutoDetectingChat(true);
    setError(null);
    try {
      const res = await fetch("/api/telegram/resolve-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: telegramBotToken.trim() }),
      });
      await throwIfNotOk(res);
      const data = (await parseJson(res)) as { chatId: string; userId: string | null };
      if (!data.userId) {
        throw new Error(
          "Nao encontramos um usuario (from.id). Envie /start para o bot em uma conversa privada e tente novamente.",
        );
      }
      setTelegramUserId(String(data.userId));
      setTelegramChatId(data.chatId ? String(data.chatId) : null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Nao foi possivel detectar o usuario automaticamente.",
      );
    } finally {
      setAutoDetectingChat(false);
    }
  }

  async function resolveTelegramContextOrThrow() {
    if (telegramUserId.trim().length >= 2) return;
    const token = telegramBotToken.trim();
    if (!token) {
      throw new Error("Telegram bot token nao encontrado.");
    }
    const res = await fetch("/api/telegram/resolve-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    await throwIfNotOk(res);
    const data = (await parseJson(res)) as { chatId: string; userId: string | null };
    if (!data.userId) {
      throw new Error(
        "Nao encontramos um usuario (from.id). Envie /start para o bot no Telegram e tente novamente.",
      );
    }
    setTelegramUserId(String(data.userId));
    setTelegramChatId(data.chatId ? String(data.chatId) : null);
  }

  async function ensureSupabaseSessionFresh() {
    const supabase = createClient();
    await supabase.auth.getSession();
  }

  async function deployOneClick() {
    setLoading(true);
    setError(null);
    setStatusMessage("Criando agente...");
    try {
      await ensureSupabaseSessionFresh();
      await resolveTelegramContextOrThrow();

      const createRes = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json", ...headerUserId },
        body: JSON.stringify({ name: agentName.trim(), model, channel: "telegram" }),
      });
      await throwIfNotOk(createRes);
      const created = await parseJson<CreateAgentResponse>(createRes);

      setStatusMessage("Salvando configuracao (provider + Telegram)...");
      const configRes = await fetch(`/api/agents/${created.agent.id}/config`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headerUserId },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          telegramBotToken: telegramBotToken.trim(),
          telegramUserId: telegramUserId.trim(),
          telegramChatId: telegramChatId?.trim() || undefined,
        }),
      });
      await throwIfNotOk(configRes);
      await parseJson<ConfigureAgentResponse>(configRes);

      setStatusMessage("Disparando deploy no Railway...");
      const deployRes = await fetch(`/api/agents/${created.agent.id}/deploy`, {
        method: "POST",
        headers: { ...headerUserId },
      });
      await throwIfNotOk(deployRes);
      await parseJson<DeployAgentResponse>(deployRes);

      setStatusMessage("Deploy iniciado. Finalizando setup do OpenClaw...");

      const finalizeRes = await fetch(`/api/agents/${created.agent.id}/finalize`, {
        method: "POST",
        headers: { ...headerUserId },
      });
      await throwIfNotOk(finalizeRes);
      const finalized = await parseJson<FinalizeAgentResponse>(finalizeRes);
      setStatusMessage(`Setup concluido. Status atual do agente: ${finalized.agent.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar deploy.");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-black/20 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Wand2 className="h-3.5 w-3.5" />
            Deploy 1-click (beta)
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Configure e publique seu agente agora
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Voce preenche a API key. O token do Telegram vem do seu cadastro anterior.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Secrets criptografadas no banco
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Agente
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome</label>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                placeholder="Meu agente OpenClaw"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Modelo</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                {availableModels.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Provider (BYOK)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                API Key
              </label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                placeholder="Cole sua API key aqui"
                type="password"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Telegram
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Bot Token {telegramBotLabel ? `(${telegramBotLabel})` : ""}
              </label>
              <input
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                placeholder="Token do BotFather"
                type="password"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-slate-500">
                Preenchido automaticamente do seu cadastro anterior (localStorage).
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Usuario do Telegram (allowlist)
              </label>
              <input
                value={telegramUserId}
                onChange={(e) => setTelegramUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                placeholder="Ex: 123456789 (from.id)"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={autoDetectTelegramUser}
                  disabled={autoDetectingChat || !telegramBotToken.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  {autoDetectingChat ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <Bot className="h-3.5 w-3.5" />
                      Detectar usuario automaticamente
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Para detectar automaticamente, envie /start para o bot no Telegram e tente novamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {statusMessage && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          O deploy cria um Service no Railway e injeta variaveis do agente.
        </p>
        <button
          onClick={deployOneClick}
          disabled={!isReady || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando deploy...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Deploy 1-click
            </>
          )}
        </button>
      </div>
    </section>
  );
}
