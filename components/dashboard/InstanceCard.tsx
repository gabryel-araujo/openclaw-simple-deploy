"use client";

import { Bot, Power, RefreshCw, Terminal } from "lucide-react";
import { useState } from "react";

interface Instance {
  id: string;
  name: string;
  model: string;
  status: "RUNNING" | "STOPPED" | "DEPLOYING" | "FAILED";
  uptime: string;
  cpu: string;
  memory: string;
}

export function InstanceCard({ instance }: { instance: Instance }) {
  const [status, setStatus] = useState(instance.status);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (action: "START" | "STOP" | "RESTART") => {
    setIsLoading(true);
    // Mock action
    setTimeout(() => {
      if (action === "STOP") setStatus("STOPPED");
      if (action === "START" || action === "RESTART") setStatus("RUNNING");
      setIsLoading(false);
    }, 1500);
  };

  const statusColors = {
    RUNNING: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    STOPPED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    DEPLOYING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    FAILED: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-5 transition-all hover:border-slate-700 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2.5 ring-1 ring-white/10">
            <Bot className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{instance.name}</h3>
            <p className="text-xs text-slate-400">{instance.model}</p>
          </div>
        </div>
        <div
          suppressHydrationWarning
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
        >
          <div className="flex items-center gap-1.5">
            <div
              suppressHydrationWarning
              className={`h-1.5 w-1.5 rounded-full ${status === "RUNNING" ? "animate-pulse bg-current" : "bg-current"}`}
            ></div>
            {status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
        <div className="text-center border-r border-slate-800">
          <span className="block mb-1 text-slate-500">Uptime</span>
          <span className="font-mono text-white">{instance.uptime}</span>
        </div>
        <div className="text-center border-r border-slate-800">
          <span className="block mb-1 text-slate-500">CPU</span>
          <span className="font-mono text-white">{instance.cpu}</span>
        </div>
        <div className="text-center">
          <span className="block mb-1 text-slate-500">Memória</span>
          <span className="font-mono text-white">{instance.memory}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {status === "RUNNING" ? (
          <>
            <button
              onClick={() => handleAction("RESTART")}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Reiniciar
            </button>
            <button
              onClick={() => handleAction("STOP")}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50"
              title="Parar Agente"
            >
              <Power className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => handleAction("START")}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-50"
          >
            <Power className="h-3.5 w-3.5" />
            Iniciar
          </button>
        )}

        <button
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white border border-slate-700"
          title="Ver Logs"
        >
          <Terminal className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
