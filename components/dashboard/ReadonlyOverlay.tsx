"use client";

import { usePathname } from "next/navigation";
import { useSubscription } from "./SubscriptionContext";
import { Lock } from "lucide-react";
import Link from "next/link";

// Pages that should remain interactive regardless of subscription status
const EXEMPT_PATHS = ["/dashboard/billing"];

export function ReadonlyOverlay({ children }: { children: React.ReactNode }) {
  const { isActive, loading } = useSubscription();
  const pathname = usePathname();

  const isExempt = EXEMPT_PATHS.some((path) => pathname.startsWith(path));
  const showOverlay = !loading && !isActive && !isExempt;

  return (
    <div className="relative">
      {children}

      {showOverlay && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-28 rounded-2xl bg-slate-950/70 backdrop-blur-[2px]"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/90 px-8 py-7 text-center shadow-2xl max-w-sm">
            <span className="rounded-full bg-amber-500/15 p-3 ring-1 ring-amber-500/30">
              <Lock className="h-6 w-6 text-amber-400" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">
                Acesso restrito
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Sua assinatura está inativa. Regularize seu pagamento para
                continuar usando a plataforma.
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110"
            >
              Ver opções de pagamento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
