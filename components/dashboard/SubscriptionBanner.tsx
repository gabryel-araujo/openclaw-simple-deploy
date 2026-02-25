"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSubscription } from "./SubscriptionContext";

export function SubscriptionBanner() {
  const { isActive, loading, validUntil, subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Don't show while loading, if active, or if user dismissed
  if (loading || isActive || dismissed) return null;

  // Determine message based on state
  let message = "Regularize seu pagamento para continuar usando a plataforma.";
  if (!subscription) {
    message = "Você não possui uma assinatura ativa.";
  } else if (validUntil) {
    const expiredAt = new Date(validUntil).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    message = `Seu período de acesso expirou em ${expiredAt}. Renove para continuar usando.`;
  }

  return (
    <div
      role="alert"
      className="relative flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 shadow-lg backdrop-blur-sm"
    >
      {/* Icon */}
      <span className="shrink-0 rounded-full bg-amber-500/20 p-1.5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      </span>

      {/* Message */}
      <p className="flex-1">
        <span className="font-semibold text-amber-200">
          Problema no pagamento.{" "}
        </span>
        {message}
      </p>

      {/* CTA */}
      <Link
        href="/dashboard/billing"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-all hover:bg-amber-400"
      >
        Regularizar
        <ArrowRight className="h-3 w-3" />
      </Link>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-full p-1 text-amber-400/60 transition-colors hover:bg-amber-500/20 hover:text-amber-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
