"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DeployPhase =
  | "creating"
  | "configuring"
  | "deploying"
  | "finalizing"
  | "success"
  | "error";

interface DeployConfig {
  agentName: string;
  model: string;
  provider: string;
  apiKey: string;
  telegramBotToken: string;
  telegramUserId: string;
  telegramChatId?: string;
}

interface DeployModalProps {
  config: DeployConfig;
  userId: string;
  onComplete: () => void;
  onError: (message: string) => void;
}

const PHASE_LABELS: Record<DeployPhase, string> = {
  creating: "Criando agente...",
  configuring: "Salvando configuração (provider + Telegram)...",
  deploying: "Disparando deploy no Railway...",
  finalizing: "Finalizando setup do OpenClaw...",
  success: "Deploy concluído com sucesso!",
  error: "Erro durante o deploy.",
};

const TOTAL_SECONDS = 10 * 60;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function throwIfNotOk(response: Response) {
  if (response.ok) return;
  const data = (await parseJson(response)) as { error?: string };
  throw new Error(
    data?.error ?? `Request failed with status ${response.status}`,
  );
}

export function DeployModal({
  config,
  userId,
  onComplete,
  onError,
}: DeployModalProps) {
  const [phase, setPhase] = useState<DeployPhase>("creating");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deployStartedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase !== "success" && phase !== "error") {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Run deploy pipeline
  const runDeploy = useCallback(async () => {
    const headers = { "content-type": "application/json", "x-user-id": userId };

    try {
      setPhase("creating");
      const createRes = await fetch("/api/agents", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: config.agentName.trim(),
          model: config.model,
          channel: "telegram",
        }),
      });
      await throwIfNotOk(createRes);
      const created = (await parseJson(createRes)) as {
        agent: { id: string };
      };

      setPhase("configuring");
      const configRes = await fetch(`/api/agents/${created.agent.id}/config`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey.trim(),
          telegramBotToken: config.telegramBotToken.trim(),
          telegramUserId: config.telegramUserId.trim(),
          telegramChatId: config.telegramChatId?.trim() || undefined,
        }),
      });
      await throwIfNotOk(configRes);

      setPhase("deploying");
      const deployRes = await fetch(`/api/agents/${created.agent.id}/deploy`, {
        method: "POST",
        headers: { "x-user-id": userId },
      });
      await throwIfNotOk(deployRes);

      setPhase("finalizing");
      const finalizeRes = await fetch(
        `/api/agents/${created.agent.id}/finalize`,
        {
          method: "POST",
          headers: { "x-user-id": userId },
        },
      );
      await throwIfNotOk(finalizeRes);

      setPhase("success");
      if (timerRef.current) clearInterval(timerRef.current);

      // Clear localStorage to prevent creating duplicate services
      try {
        localStorage.removeItem("brclaw:selected_model");
        localStorage.removeItem("brclaw:selected_channel");
        localStorage.removeItem("brclaw:telegram_token");
        localStorage.removeItem("brclaw:telegram_bot");
      } catch {
        /* ignore */
      }

      // Auto-close after success animation
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (e) {
      setPhase("error");
      if (timerRef.current) clearInterval(timerRef.current);
      const msg =
        e instanceof Error ? e.message : "Erro desconhecido no deploy.";
      setErrorMsg(msg);
      setTimeout(() => {
        onError(msg);
      }, 2000);
    }
  }, [config, userId, onComplete, onError]);

  useEffect(() => {
    if (!deployStartedRef.current) {
      deployStartedRef.current = true;
      void runDeploy();
    }
  }, [runDeploy]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const progress =
    phase === "creating"
      ? 15
      : phase === "configuring"
        ? 35
        : phase === "deploying"
          ? 60
          : phase === "finalizing"
            ? 85
            : phase === "success"
              ? 100
              : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="glass-strong w-full max-w-md rounded-2xl p-8 animate-scaleIn">
        {phase === "success" ? (
          /* ─── Success State ─── */
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="animate-successBounce">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30">
                <svg viewBox="0 0 52 52" className="h-14 w-14" fill="none">
                  <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="2"
                    strokeDasharray="157"
                    strokeDashoffset="0"
                    className="animate-checkmarkDraw"
                  />
                  <path
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    fill="none"
                    stroke="rgb(52, 211, 153)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="0"
                    className="animate-checkmarkDraw"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">
                Deploy concluído!
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Seu agente está sendo inicializado. Em instantes ele estará
                pronto para uso.
              </p>
            </div>
          </div>
        ) : phase === "error" ? (
          /* ─── Error State ─── */
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/30">
              <svg
                viewBox="0 0 24 24"
                className="h-10 w-10 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Erro no deploy</h3>
              <p className="mt-2 text-sm text-red-300/80">{errorMsg}</p>
            </div>
          </div>
        ) : (
          /* ─── Deploying State ─── */
          <div className="flex flex-col items-center gap-6">
            {/* Timer */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Tempo estimado
              </span>
              <span className="font-mono text-4xl font-bold tracking-wider text-cyan-400 animate-countdownPulse">
                {timeDisplay}
              </span>
            </div>

            {/* Phase label */}
            <div className="flex items-center gap-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 w-full">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-sm text-cyan-200">
                {PHASE_LABELS[phase]}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2.5 w-full">
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0 mt-0.5 text-amber-400"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-amber-200/80">
                Não feche nem recarregue esta página até o deploy ser concluído.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
