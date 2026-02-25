"use client";

import { useEffect, useMemo, useState } from "react";

interface AgentListItem {
  id: string;
  name: string;
  model: string;
  channel: string;
  status: string;
  railwayServiceId: string | null;
  railwayDomain?: string | null;
}

interface ListAgentsResponse {
  agents: AgentListItem[];
}

interface AgentMutationResponse {
  agent: AgentListItem;
}

interface ReadLogsResponse {
  logs: string | null;
}

interface ApiErrorResponse {
  error: string;
}

interface CreateAgentRequest {
  name: string;
  model: string;
  channel: "telegram";
}

interface ConfigureAgentRequest {
  provider: "openai" | "anthropic";
  apiKey: string;
  telegramBotToken: string;
  telegramUserId: string;
  telegramChatId?: string;
}

const MODEL_PRESETS = [
  { value: "gpt-4o", provider: "openai" as const },
  { value: "claude-3.5-sonnet", provider: "anthropic" as const },
  { value: "claude-3.5-opus", provider: "anthropic" as const },
] as const;

const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";

export function AgentDashboard({ userId }: { userId: string }) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("Meu Agente BR");
  const [newAgentModel, setNewAgentModel] = useState<
    (typeof MODEL_PRESETS)[number]["value"]
  >(MODEL_PRESETS[0].value);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingUi, setOpeningUi] = useState(false);
  const [autoDetectingChat, setAutoDetectingChat] = useState(false);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? null,
    [agents, selectedId],
  );

  const selectedAgentModelProvider = useMemo(() => {
    const model = selectedAgent?.model?.trim().toLowerCase() ?? "";
    if (!model) return null;
    if (model.startsWith("gpt-")) return "openai" as const;
    if (model.startsWith("claude-")) return "anthropic" as const;
    return null;
  }, [selectedAgent?.model]);

  useEffect(() => {
    if (selectedAgentModelProvider) {
      setProvider(selectedAgentModelProvider);
    }
  }, [selectedAgentModelProvider]);

  async function parseJson<T>(response: Response): Promise<T> {
    return (await response.json()) as T;
  }

  async function throwIfNotOk(response: Response) {
    if (response.ok) {
      return;
    }

    const data = await parseJson<ApiErrorResponse>(response);
    throw new Error(
      data.error ?? `Request failed with status ${response.status}`,
    );
  }

  async function loadAgents() {
    const response = await fetch("/api/agents", {
      headers: { "x-user-id": userId },
    });
    await throwIfNotOk(response);
    const data = await parseJson<ListAgentsResponse>(response);
    setAgents(data.agents ?? []);
    if (!selectedId && data.agents?.[0]?.id) {
      setSelectedId(data.agents[0].id);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(LS_TELEGRAM_TOKEN_KEY) ?? "";
      if (savedToken && !telegramBotToken.trim()) {
        setTelegramBotToken(savedToken);
      }
    } catch {
      // ignore
    }
  }, []);

  async function autoDetectTelegramUser() {
    const token = telegramBotToken.trim();
    if (!token) return;
    setAutoDetectingChat(true);
    try {
      const res = await fetch("/api/telegram/resolve-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      await throwIfNotOk(res);
      const data = (await parseJson(res)) as {
        chatId: string;
        userId: string | null;
      };
      if (!data.userId) {
        throw new Error(
          "Nao encontramos um usuario (from.id). Envie /start para o bot em uma conversa privada e tente novamente.",
        );
      }
      setTelegramUserId(String(data.userId));
      setTelegramChatId(data.chatId ? String(data.chatId) : "");
      setLogs("Telegram detectado automaticamente (userId/chatId).");
    } finally {
      setAutoDetectingChat(false);
    }
  }

  async function createAgent() {
    setLoading(true);
    try {
      const payload: CreateAgentRequest = {
        name,
        model: newAgentModel,
        channel: "telegram",
      };
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": userId },
        body: JSON.stringify(payload),
      });
      await throwIfNotOk(response);
      await loadAgents();
    } finally {
      setLoading(false);
    }
  }

  async function configureAgent() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const payload: ConfigureAgentRequest = {
        provider,
        apiKey,
        telegramBotToken,
        telegramUserId,
        telegramChatId: telegramChatId?.trim() ? telegramChatId : undefined,
      };
      const response = await fetch(`/api/agents/${selectedAgent.id}/config`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": userId },
        body: JSON.stringify(payload),
      });
      await throwIfNotOk(response);
      await parseJson<AgentMutationResponse>(response);
      await loadAgents();
      setLogs(
        "Configuração salva. Rode 'Aplicar Setup (finalize)' para reaplicar no OpenClaw.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function finalizeAgent() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/finalize`, {
        method: "POST",
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(response);
      await parseJson<AgentMutationResponse>(response);
      await loadAgents();
      await readLogs();
      setLogs((prev) =>
        prev?.trim()
          ? `${prev}\n\n[ui] finalize concluído.`
          : "[ui] finalize concluído.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deployAgent() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/deploy`, {
        method: "POST",
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(response);
      await parseJson<AgentMutationResponse>(response);

      // Ensure OpenClaw setup runs (Telegram allowlist + provider secret + model, etc.).
      const finalizeRes = await fetch(
        `/api/agents/${selectedAgent.id}/finalize`,
        {
          method: "POST",
          headers: { "x-user-id": userId },
        },
      );
      await throwIfNotOk(finalizeRes);
      await parseJson<AgentMutationResponse>(finalizeRes);

      await loadAgents();
      await readLogs();
    } finally {
      setLoading(false);
    }
  }

  async function restartAgent() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}/restart`, {
        method: "POST",
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(response);
      await parseJson<AgentMutationResponse>(response);
      await loadAgents();
    } finally {
      setLoading(false);
    }
  }

  async function readLogs() {
    if (!selectedAgent) return;
    const response = await fetch(`/api/agents/${selectedAgent.id}/logs`, {
      headers: { "x-user-id": userId },
    });
    await throwIfNotOk(response);
    const data = await parseJson<ReadLogsResponse>(response);
    setLogs(data.logs ?? "");
  }

  async function copyGatewayToken() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/agents/${selectedAgent.id}/gateway-token`,
        {
          headers: { "x-user-id": userId },
        },
      );
      await throwIfNotOk(response);
      const data = (await parseJson<{ token: string }>(response)) as {
        token: string;
      };
      await navigator.clipboard.writeText(data.token);
      setLogs("Gateway token copiado para a area de transferencia.");
    } finally {
      setLoading(false);
    }
  }

  async function copySetupPassword() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/agents/${selectedAgent.id}/setup-password`,
        {
          headers: { "x-user-id": userId },
        },
      );
      await throwIfNotOk(response);
      const data = (await parseJson<{ password: string }>(response)) as {
        password: string;
      };
      await navigator.clipboard.writeText(data.password);
      setLogs("Setup password copiado para a area de transferencia.");
    } finally {
      setLoading(false);
    }
  }

  async function openControlUi() {
    if (!selectedAgent?.railwayDomain) return;
    setOpeningUi(true);
    try {
      // Open the Control UI from the gateway host (via /setup) to avoid "origin not allowed".
      // Also copy the setup password so the user can authenticate quickly.
      const response = await fetch(
        `/api/agents/${selectedAgent.id}/setup-password`,
        {
          headers: { "x-user-id": userId },
        },
      );
      await throwIfNotOk(response);
      const data = (await parseJson<{ password: string }>(response)) as {
        password: string;
      };
      await navigator.clipboard.writeText(data.password);
      const url = `https://${selectedAgent.railwayDomain}/setup`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      const url = `https://${selectedAgent.railwayDomain}/setup`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningUi(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-lg font-semibold">Novo Agente</h2>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do agente"
          />
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={newAgentModel}
            onChange={(event) =>
              setNewAgentModel(
                event.target.value as (typeof MODEL_PRESETS)[number]["value"],
              )
            }
          >
            {MODEL_PRESETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          <button
            onClick={createAgent}
            disabled={loading}
            className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900"
          >
            Criar Agente (DRAFT)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-lg font-semibold">Agentes</h2>
        <p className="mt-1 text-xs text-slate-400">
          Limited cloud servers — only 7 left!
        </p>
        <div className="mt-4 space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                selectedId === agent.id
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <strong>{agent.name}</strong>
                <span className="text-xs text-slate-300">{agent.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{agent.model}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-lg font-semibold">
          Configuração (Telegram + API Key)
        </h2>
        <div className="mt-4 space-y-3">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as "openai" | "anthropic")
            }
          >
            <option
              value="openai"
              disabled={selectedAgentModelProvider === "anthropic"}
            >
              openai
            </option>
            <option
              value="anthropic"
              disabled={selectedAgentModelProvider === "openai"}
            >
              anthropic
            </option>
          </select>
          <div className="text-xs text-slate-400">
            Modelo do agente:{" "}
            <span className="font-mono text-slate-200">
              {selectedAgent?.model ?? "-"}
            </span>
          </div>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Provider API Key (BYOK)"
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={telegramBotToken}
            onChange={(event) => setTelegramBotToken(event.target.value)}
            placeholder="Telegram Bot Token"
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={telegramUserId}
            onChange={(event) => setTelegramUserId(event.target.value)}
            placeholder="Telegram User ID (from.id) - allowlist"
          />
          <button
            type="button"
            onClick={autoDetectTelegramUser}
            disabled={autoDetectingChat || !telegramBotToken.trim()}
            className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
            title="Envia /start para o bot e depois clique aqui"
          >
            {autoDetectingChat
              ? "Detectando..."
              : "Detectar userId/chatId automaticamente"}
          </button>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={telegramChatId}
            onChange={(event) => setTelegramChatId(event.target.value)}
            placeholder="Telegram Chat ID (opcional)"
          />
          <button
            onClick={configureAgent}
            disabled={!selectedAgent || loading}
            className="w-full rounded-lg border border-cyan-400 px-3 py-2 text-sm text-cyan-300"
          >
            Salvar Configuração
          </button>
          <button
            onClick={finalizeAgent}
            disabled={!selectedAgent || loading}
            className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
            title="Reaplica setup do OpenClaw no serviço já deployado (corrige provider/model sem recriar)."
          >
            Aplicar Setup (finalize)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-lg font-semibold">Deploy e Operação</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={deployAgent}
            disabled={!selectedAgent || loading}
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900"
          >
            Deploy 1-Click
          </button>
          <button
            onClick={restartAgent}
            disabled={!selectedAgent || loading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
          >
            Restart
          </button>
          <button
            onClick={readLogs}
            disabled={!selectedAgent || loading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
          >
            Ver Logs
          </button>
          <button
            onClick={copyGatewayToken}
            disabled={!selectedAgent || loading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
            title="Necessario para conectar a Control UI ao gateway"
          >
            Copiar Gateway Token
          </button>
          <button
            onClick={copySetupPassword}
            disabled={!selectedAgent || loading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
            title="Necessario para acessar /setup no gateway do Railway"
          >
            Copiar Setup Password
          </button>
          {selectedAgent?.railwayDomain ? (
            <button
              onClick={openControlUi}
              disabled={loading || openingUi}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
            >
              Abrir Setup (/setup)
            </button>
          ) : null}
        </div>
        <pre className="mt-4 min-h-[120px] rounded-lg border border-slate-800 bg-black/40 p-3 text-xs text-slate-300">
          {logs || "Sem logs ainda"}
        </pre>
      </section>
    </div>
  );
}
