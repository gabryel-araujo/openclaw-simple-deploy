"use client";

import { AgentDashboard } from "@/components/agent-dashboard";
import { DeployWizard } from "@/components/dashboard/DeployWizard";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import {
  Bot,
  LogOut,
  TerminalSquare,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const runbookItems = [
  "Criar agente (DRAFT) com nome, modelo e canal",
  "Configurar secrets (provider + Telegram)",
  "Promover para CONFIGURED",
  "Executar Deploy 1-Click",
  "Ler logs e validar status RUNNING",
  "Testar conversa real no Telegram",
];

export function DashboardContent({ user }: { user: User }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Onboarding e Deploy do OpenClaw
          </h1>
          <p className="mt-1 text-slate-400">
            Painel operacional para criar agente, configurar provider/canal e fazer deploy com logs.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400">
            <Bot className="h-4 w-4" />
            Setup OpenClaw
          </span>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 p-1 pr-3 transition-colors hover:bg-slate-700"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "User"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <span className="font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-200 md:block">
                {user.user_metadata?.full_name?.split(" ")[0] || "Usuário"}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-800 bg-slate-900 shadow-lg ring-1 ring-black/20">
                <div className="py-1">
                  <div className="border-b border-slate-800 px-4 py-3">
                    <p className="truncate text-sm font-medium text-white">
                      {user.user_metadata?.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <UserIcon className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <DeployWizard user={user} />

          <section className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">
                Painel operacional (criação, configuração, deploy e logs)
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-300">
              Este bloco já usa suas APIs atuais para criar agente, salvar secrets,
              disparar deploy, reiniciar e consultar logs.
            </p>
            <AgentDashboard userId={user.id} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="text-lg font-semibold text-white">Runbook de operação</h2>
            <p className="mt-1 text-sm text-slate-400">
              Sequência prática para ativar um agente novo sem perder etapas.
            </p>
            <ol className="mt-4 space-y-3">
              {runbookItems.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
