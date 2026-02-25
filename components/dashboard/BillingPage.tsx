"use client";

import { User } from "@supabase/supabase-js";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Loader2,
  Receipt,
  Shield,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SubscriptionData {
  id: string;
  status: string;
  planId: string;
  maxAgents: number;
  nextPaymentDate: string | null;
  createdAt: string;
}

interface SubscriptionResponse {
  active: boolean;
  subscription: SubscriptionData | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  authorized: {
    label: "Ativa",
    className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  pending: {
    label: "Pendente",
    className: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  paused: {
    label: "Pausada",
    className: "text-red-400 bg-red-400/10 border-red-400/20",
  },
  cancelled: {
    label: "Cancelada",
    className: "text-red-400 bg-red-400/10 border-red-400/20",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function BillingPage({ user: _user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subData, setSubData] = useState<SubscriptionResponse | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (!res.ok) throw new Error("Erro ao buscar assinatura");
      const data = (await res.json()) as SubscriptionResponse;
      setSubData(data);
    } catch {
      toast.error("Erro ao carregar dados da assinatura.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/payment/create-preference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId: "pro-monthly" }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data?.error ?? "Erro ao criar assinatura");
      }

      const data = (await res.json()) as { init_point: string };
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("URL de redirecionamento não disponível");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao assinar.");
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const sub = subData?.subscription;
  const isActive = subData?.active ?? false;
  const statusInfo = STATUS_LABELS[sub?.status ?? ""] ?? STATUS_LABELS.pending;

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Cobrança
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gerencie sua assinatura e acompanhe seus pagamentos.
        </p>
      </div>

      {/* ─── No Subscription State ─── */}
      {!sub && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="relative p-8 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex rounded-2xl bg-linear-to-br from-cyan-400/20 to-indigo-500/20 p-4 ring-1 ring-white/10 mb-5">
                <Sparkles className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Plano Pro – R$ 49,90/mês
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Deploy 1-click de agentes OpenClaw, integração com Telegram,
                dashboard de gerenciamento e uptime 99.9% garantido.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6 max-w-lg mx-auto">
                {[
                  "Deploy 1-click",
                  "Integração Telegram",
                  "Dashboard completo",
                  "Uptime 99.9%",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1.5 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50"
              >
                {subscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {subscribing ? "Redirecionando..." : "Assinar agora"}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
                <Shield className="h-3 w-3" />
                Pagamento seguro via Mercado Pago
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Active Subscription ─── */}
      {sub && (
        <>
          {/* Inactive subscription banner */}
          {!isActive && sub.status !== "pending" && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-300">
                  Assinatura inativa
                </h3>
                <p className="text-xs text-red-400/70 mt-0.5">
                  Seus agentes foram pausados. Renove sua assinatura para
                  reativá-los.
                </p>
              </div>
            </div>
          )}

          {/* Plan card */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="relative p-6">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-linear-to-br from-cyan-400/20 to-indigo-500/20 p-3 ring-1 ring-white/10">
                    <Sparkles className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">
                        Plano Pro
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusInfo.className}`}
                      >
                        <Star className="h-2.5 w-2.5" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Deploy 1-click · Telegram · Dashboard · Uptime 99.9%
                    </p>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Próxima cobrança: {formatDate(sub.nextPaymentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        Assinante desde: {formatDate(sub.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    R$ 49,90
                  </span>
                  <span className="text-sm text-slate-500 ml-1">/mês</span>
                  <div className="mt-1 text-xs text-slate-500">
                    Até {sub.maxAgents} agente{sub.maxAgents > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Plan features */}
            <div className="border-t border-slate-800/60 bg-slate-950/30 px-6 py-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  "Deploy 1-click do OpenClaw",
                  "Integração com Telegram",
                  "Dashboard de gerenciamento",
                  "Uptime 99.9% garantido",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subscription details */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-4 w-4 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">
                Detalhes da assinatura
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3">
                <span className="text-sm text-slate-400">Status</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3">
                <span className="text-sm text-slate-400">
                  Limite de agentes
                </span>
                <span className="text-sm font-medium text-white">
                  {sub.maxAgents}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3">
                <span className="text-sm text-slate-400">Próxima cobrança</span>
                <span className="text-sm font-medium text-white">
                  {formatDate(sub.nextPaymentDate)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3">
                <span className="text-sm text-slate-400">
                  Meio de pagamento
                </span>
                <span className="text-sm font-medium text-slate-300">
                  Mercado Pago (recorrente)
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-600">
              <Shield className="h-3 w-3" />
              Cobranças automáticas gerenciadas pelo Mercado Pago
            </div>
          </div>

          {/* ─── Cancel / Danger Zone ─── */}
          {isActive && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-red-300">
                    Cancelar assinatura
                  </h3>
                  <p className="text-xs text-red-400/60 mt-0.5">
                    Seus agentes serão desligados ao final do período
                    contratado.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Tem certeza que deseja cancelar sua assinatura? Seus agentes serão desligados.",
                      )
                    ) {
                      toast("Em breve: cancelamento via API!", {
                        icon: "🚧",
                      });
                    }
                  }}
                  className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  Cancelar assinatura
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
