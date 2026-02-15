"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <main className="mx-auto flex flex-col min-h-screen max-w-5xl items-center px-6 py-16 justify-center">
      <section className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/60 p-8 shadow-[0_0_120px_-20px_rgba(34,211,238,0.35)] backdrop-blur text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Assinatura Mensal
        </h1>
        <p className="text-slate-400 mb-8">
          Para continuar e criar seus agentes, é necessário ativar sua
          assinatura.
        </p>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Plano Pro</span>
            <span className="text-cyan-400 font-bold">R$ 49,90/mês</span>
          </div>
          <ul className="text-left text-sm text-slate-500 space-y-2 mt-4">
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✓</span> Deploy ilimitado de
              agentes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✓</span> Integração com Telegram
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✓</span> Suporte priorizado
            </li>
          </ul>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-slate-800"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processando...
            </>
          ) : (
            "Assinar Agora (Simulação)"
          )}
        </button>

        <p className="text-xs text-slate-600 mt-4">
          Ambiente seguro. Pagamento processado pelo Mercado Pago (futuramente).
        </p>
      </section>
    </main>
  );
}
