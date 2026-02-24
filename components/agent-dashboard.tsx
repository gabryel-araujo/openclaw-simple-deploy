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

interface DeployAgentResponse extends AgentMutationResponse {
  deploymentId: string;
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

const models = ["gpt-4o", "claude-3.5-sonnet", "claude-3.5-opus", "gemini-1.5-flash"];

export function AgentDashboard({ userId }: { userId: string }) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("Meu Agente BR");
  const [model, setModel] = useState(models[0]);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingUi, setOpeningUi] = useState(false);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? null,
    [agents, selectedId]
  );

  async function parseJson<T>(response: Response): Promise<T> {
    return (await response.json()) as T;
  }

  async function throwIfNotOk(response: Response) {
    if (response.ok) {
      return;
    }

    const data = await parseJson<ApiErrorResponse>(response);
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
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

  async function createAgent() {
    setLoading(true);
    try {
      const payload: CreateAgentRequest = { name, model, channel: "telegram" };
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": userId },
        body: JSON.stringify(payload)
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
        body: JSON.stringify(payload)
      });
      await throwIfNotOk(response);
      await parseJson<DeployAgentResponse>(response);
      await loadAgents();
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
      const response = await fetch(`/api/agents/${selectedAgent.id}/gateway-token`, {
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(response);
      const data = (await parseJson<{ token: string }>(response)) as { token: string };
      await navigator.clipboard.writeText(data.token);
      setLogs("Gateway token copiado para a area de transferencia.");
    } finally {
      setLoading(false);
    }
  }

  async function openControlUi() {
    if (!selectedAgent?.railwayDomain) return;
    setOpeningUi(true);
    try {
      // OpenClaw Control UI supports a tokenized link: /openclaw?token=...
      // This avoids the manual "paste gateway token" step.
      const response = await fetch(`/api/agents/${selectedAgent.id}/gateway-token`, {
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(response);
      const data = (await parseJson<{ token: string }>(response)) as { token: string };
      const base = `https://${selectedAgent.railwayDomain}/openclaw`;
      const url = data.token ? `${base}?token=${encodeURIComponent(data.token)}` : base;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      const base = `https://${selectedAgent.railwayDomain}/openclaw`;
      window.open(base, "_blank", "noopener,noreferrer");
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
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            {models.map((option) => (
              <option key={option} value={option}>
                {option}
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
        <p className="mt-1 text-xs text-slate-400">Limited cloud servers — only 7 left!</p>
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
        <h2 className="text-lg font-semibold">Configuração (Telegram + API Key)</h2>
        <div className="mt-4 space-y-3">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={provider}
            onChange={(event) => setProvider(event.target.value as "openai" | "anthropic")}
          >
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
          </select>
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
            Configurar Agente (CONFIGURED)
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
          {selectedAgent?.railwayDomain ? (
            <button
              onClick={openControlUi}
              disabled={loading || openingUi}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
            >
              Abrir Control UI
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
