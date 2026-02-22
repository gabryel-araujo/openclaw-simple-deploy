"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

interface TelegramSetupModalProps {
  onConfirm: (token: string, bot: BotInfo) => void;
  onClose: () => void;
}

const STEPS = [
  {
    number: "1",
    title: "Abra o Telegram",
    description: (
      <>
        Abra o Telegram e busque por{" "}
        <a
          href="https://t.me/BotFather"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline hover:text-cyan-300"
        >
          @BotFather
        </a>
      </>
    ),
  },
  {
    number: "2",
    title: "Crie um novo bot",
    description: (
      <>
        Envie o comando{" "}
        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 text-xs">
          /newbot
        </code>{" "}
        para o BotFather
      </>
    ),
  },
  {
    number: "3",
    title: "Escolha um nome",
    description: "Digite um nome para o seu bot (ex: Meu Assistente)",
  },
  {
    number: "4",
    title: "Escolha um username",
    description: (
      <>
        Deve terminar em{" "}
        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 text-xs">
          bot
        </code>{" "}
        (ex: meu_assistente_bot)
      </>
    ),
  },
  {
    number: "5",
    title: "Copie o token",
    description:
      "O BotFather vai enviar uma mensagem com o token. Copie o código que começa com números seguido de dois pontos (ex: 123456789:ABC...)",
  },
];

export function TelegramSetupModal({
  onConfirm,
  onClose,
}: TelegramSetupModalProps) {
  const [step, setStep] = useState<"guide" | "token">("guide");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedBot, setValidatedBot] = useState<BotInfo | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    setValidatedBot(null);

    try {
      const res = await fetch("/api/telegram/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error ?? "Token inválido. Tente novamente.");
        return;
      }

      setValidatedBot(data.bot);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (validatedBot) {
      onConfirm(token.trim(), validatedBot);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-950 shadow-[0_0_80px_-10px_rgba(34,211,238,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30">
              <Send className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400 mb-0.5">
                Configuração
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">
                Conectar Telegram
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {(["guide", "token"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-1.5 w-16 rounded-full transition-colors ${
                  step === s || (s === "guide" && step === "token")
                    ? "bg-sky-400"
                    : "bg-slate-800"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step === "guide" ? (
            <>
              <p className="text-sm text-slate-400 mb-5">
                Siga os passos abaixo para criar seu bot no Telegram:
              </p>
              <ol className="space-y-4">
                {STEPS.map((s) => (
                  <li key={s.number} className="flex gap-4">
                    <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold">
                      {s.number}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-white mb-0.5">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                onClick={() => setStep("token")}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500/15 border border-sky-500/30 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 transition-colors"
              >
                Já tenho meu token
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setStep("guide");
                  setError(null);
                  setValidatedBot(null);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Voltar ao guia
              </button>

              <p className="text-sm text-slate-400 mb-4">
                Cole o token gerado pelo BotFather:
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setError(null);
                    setValidatedBot(null);
                  }}
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  disabled={loading}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !validatedBot && handleValidate()
                  }
                />

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Bot validated */}
                {validatedBot && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">
                        {validatedBot.name}
                      </p>
                      <p className="text-xs text-emerald-400/70">
                        @{validatedBot.username}
                      </p>
                    </div>
                    <Bot className="h-5 w-5 text-emerald-400/40 ml-auto" />
                  </div>
                )}

                {!validatedBot ? (
                  <button
                    onClick={handleValidate}
                    disabled={loading || !token.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-sky-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Validar Bot"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirm}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar e continuar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
