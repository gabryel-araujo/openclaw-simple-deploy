"use client";

import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Clipboard,
  ExternalLink,
  Key,
  Loader2,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AgentListItem {
  id: string;
  name: string;
  model: string;
  channel: string;
  status: string;
  railwayServiceId: string | null;
  railwayDomain?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  RUNNING: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  DEPLOYED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  CONFIGURED: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  DRAFT: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  FAILED: "text-red-400 bg-red-400/10 border-red-400/20",
  STOPPED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

const STATUS_DOT: Record<string, boolean> = {
  RUNNING: true,
  DEPLOYED: true,
};

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function AgentListPage({
  userId,
  readOnly = false,
}: {
  userId: string;
  readOnly?: boolean;
}) {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<
    Record<string, string | null>
  >({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

  const headers = { "x-user-id": userId };

  const loadAgents = useCallback(async () => {
    try {
      const data = await apiFetch<{ agents: AgentListItem[] }>("/api/agents", {
        headers,
      });
      setAgents(data.agents ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar agentes.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const setAgentLoading = (id: string, v: boolean) =>
    setActionLoading((prev) => ({ ...prev, [id]: v }));

  async function restartAgent(id: string) {
    setAgentLoading(id, true);
    try {
      await apiFetch(`/api/agents/${id}/restart`, {
        method: "POST",
        headers,
      });
      toast.success("Agente reiniciado!");
      await loadAgents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reiniciar.");
    } finally {
      setAgentLoading(id, false);
    }
  }

  async function toggleLogs(id: string) {
    if (expandedLogs[id] !== undefined) {
      setExpandedLogs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setAgentLoading(id, true);
    try {
      const data = await apiFetch<{ logs: string | null }>(
        `/api/agents/${id}/logs`,
        { headers },
      );
      setExpandedLogs((prev) => ({
        ...prev,
        [id]: data.logs ?? "Sem logs disponíveis.",
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar logs.");
    } finally {
      setAgentLoading(id, false);
    }
  }

  async function copyPassword(id: string) {
    setAgentLoading(id, true);
    try {
      const data = await apiFetch<{ password: string }>(
        `/api/agents/${id}/setup-password`,
        { headers },
      );
      await navigator.clipboard.writeText(data.password);
      toast.success("Senha copiada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao copiar senha.");
    } finally {
      setAgentLoading(id, false);
    }
  }

  async function copyGatewayToken(id: string) {
    setAgentLoading(id, true);
    try {
      const data = await apiFetch<{ token: string }>(
        `/api/agents/${id}/gateway-token`,
        { headers },
      );
      await navigator.clipboard.writeText(data.token);
      toast.success("Gateway token copiado!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao copiar token.");
    } finally {
      setAgentLoading(id, false);
    }
  }

  function openAgentSetup(agent: AgentListItem) {
    if (agent.railwayDomain) {
      window.open(`https://${agent.railwayDomain}/setup`, "_blank");
    } else {
      toast.error("Domínio não disponível para este agente.");
    }
  }

  async function deleteAgent(id: string, name: string) {
    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR o agente "${name}"?\n\nEssa ação é irreversível:\n• O serviço no Railway será apagado\n• Todos os dados (secrets, logs, deployments) serão removidos`,
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      `ÚLTIMA CONFIRMAÇÃO: Excluir permanentemente "${name}"?`,
    );
    if (!doubleConfirm) return;

    setAgentLoading(id, true);
    try {
      await apiFetch(`/api/agents/${id}`, {
        method: "DELETE",
        headers,
      });
      toast.success("Agente excluído permanentemente.");
      await loadAgents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir agente.");
    } finally {
      setAgentLoading(id, false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center animate-fadeIn">
        <div className="flex justify-center mb-4">
          <div className="rounded-2xl bg-slate-800/50 p-5 ring-1 ring-white/5">
            <Bot className="h-10 w-10 text-slate-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Nenhum agente encontrado
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Volte à Visão Geral e faça o deploy do seu primeiro agente para vê-lo
          listado aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slideUp">
      {readOnly && agents.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-300">
              Gerenciamento desabilitado
            </h3>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Sua assinatura está inativa. Renove na aba Cobrança para gerenciar
              seus agentes.
            </p>
          </div>
        </div>
      )}
      {agents.map((agent) => {
        const statusStyle = STATUS_STYLES[agent.status] ?? STATUS_STYLES.DRAFT;
        const isAnimated = STATUS_DOT[agent.status] ?? false;
        const isLoading = actionLoading[agent.id] ?? false;
        const logs = expandedLogs[agent.id];
        const logsOpen = logs !== undefined;

        return (
          <div
            key={agent.id}
            className="glass rounded-2xl overflow-hidden transition-all hover:border-cyan-500/15"
          >
            {/* Card body */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-xl bg-slate-800/60 p-2.5 ring-1 ring-white/5 shrink-0">
                    <Bot className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {agent.model} · {agent.channel}
                    </p>
                  </div>
                </div>
                <div
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle}`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full bg-current ${isAnimated ? "animate-pulse" : ""}`}
                    />
                    {agent.status}
                  </div>
                </div>
              </div>

              {/* Info bar */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-400 rounded-lg bg-slate-900/40 p-3 border border-slate-800/50">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                    ID
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] truncate block">
                    {agent.id.slice(0, 12)}...
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                    Railway
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] truncate block">
                    {agent.railwayServiceId
                      ? `${agent.railwayServiceId.slice(0, 12)}...`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => restartAgent(agent.id)}
                  disabled={isLoading || readOnly}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Reiniciar
                </button>
                <button
                  onClick={() => toggleLogs(agent.id)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Logs
                  {logsOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => openAgentSetup(agent)}
                  disabled={!agent.railwayDomain}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Setup
                </button>
                <button
                  onClick={() => copyGatewayToken(agent.id)}
                  disabled={isLoading || readOnly}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <Key className="h-3.5 w-3.5" />
                  Gateway Token
                </button>
                <button
                  onClick={() => copyPassword(agent.id)}
                  disabled={isLoading || readOnly}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Copiar Senha
                </button>

                {/* Destructive delete */}
                <button
                  onClick={() => deleteAgent(agent.id, agent.name)}
                  disabled={isLoading || readOnly}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/30 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Expanded logs */}
            {logsOpen && (
              <div className="border-t border-slate-800/60 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Terminal className="h-3.5 w-3.5" />
                    Logs do agente
                  </div>
                  <button
                    onClick={() => {
                      if (logs) {
                        navigator.clipboard.writeText(logs);
                        toast.success("Logs copiados!");
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>
                <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {logs}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
