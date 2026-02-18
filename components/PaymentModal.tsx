"use client";

import { CheckIcon, Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  planId: string;
  onClose: () => void;
}

const PLAN_DISPLAY = {
  "pro-monthly": {
    title: "Plano Pro",
    price: "R$ 49,90",
    period: "/mês",
    features: [
      "Deploy 1-click do OpenClaw",
      "Integração com Telegram",
      "Dashboard de gerenciamento",
      "Uptime 99.9% garantido",
    ],
  },
} as const;

export function PaymentModal({ planId, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLAN_DISPLAY[planId as keyof typeof PLAN_DISPLAY];

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the planId is sent — price is resolved server-side
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detail in dev, generic message in prod
        const msg = data.detail ?? data.error ?? "Erro ao processar pagamento.";
        setError(msg);
        return;
      }

      // Redirect to Mercado Pago Checkout Pro
      window.location.href = data.init_point;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-950 shadow-[0_0_80px_-10px_rgba(34,211,238,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400 mb-1">
              SimpleClaw BR
            </p>
            <h2 className="text-xl font-bold text-white">Ativar Licença</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Price highlight */}
        <div className="px-6 py-6 text-center border-b border-slate-800 bg-slate-900/40">
          <p className="text-slate-400 text-sm mb-2">{plan?.title ?? planId}</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-5xl font-extrabold text-white tracking-tight">
              {plan?.price ?? "—"}
            </span>
            <span className="text-slate-400 text-lg mb-1">
              {plan?.period ?? ""}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Cobrado mensalmente · Cancele quando quiser
          </p>
        </div>

        {/* Features */}
        <div className="px-6 py-5">
          <ul className="space-y-3">
            {plan?.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-cyan-500/15 border border-cyan-500/30">
                  <CheckIcon className="h-3 w-3 text-cyan-400" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CTA */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : (
              <>
                Pagar com Mercado Pago
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamento seguro processado pelo Mercado Pago
          </div>
        </div>
      </div>
    </div>
  );
}
