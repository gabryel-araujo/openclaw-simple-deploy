"use client";

import { AgentDashboard } from "@/components/agent-dashboard";
import { DeployWizard } from "@/components/dashboard/DeployWizard";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  FolderTree,
  KeyRound,
  LogOut,
  Server,
  ShieldCheck,
  TerminalSquare,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ChecklistItem = {
  title: string;
  description: string;
  status: "required" | "recommended";
};

const setupChecklist: ChecklistItem[] = [
  {
    title: "Definir host/infra do OpenClaw",
    description:
      "Escolher onde o gateway vai rodar (VM/servidor) e garantir persistência de arquivos e estado.",
    status: "required",
  },
  {
    title: "Configurar paths e envs base",
    description:
      "Preparar OPENCLAW_HOME, OPENCLAW_STATE_DIR e OPENCLAW_CONFIG_PATH para persistir configuração e sessão.",
    status: "required",
  },
  {
    title: "Conectar provedor de IA (BYOK)",
    description:
      "Cadastrar provider e API key (OpenAI/Anthropic) para o agente responder mensagens.",
    status: "required",
  },
  {
    title: "Configurar canal (Telegram)",
    description:
      "Validar bot token e informar chat ID para o agente operar no canal.",
    status: "required",
  },
  {
    title: "Deploy e validação operacional",
    description:
      "Executar deploy, conferir logs, status e testar fluxo ponta a ponta.",
    status: "required",
  },
  {
    title: "Hardening de operação",
    description:
      "Definir rotina de restart, monitoramento e revisão de logs em caso de falha.",
    status: "recommended",
  },
];

const blueprintSections = [
  {
    icon: Server,
    title: "Infra & Runtime",
    bullets: [
      "Host (Railway/VM/container) com processo do gateway",
      "Persistência de diretório de estado/config",
      "Capacidade para logs e reinícios seguros",
    ],
  },
  {
    icon: FolderTree,
    title: "Configuração OpenClaw",
    bullets: [
      "OPENCLAW_HOME",
      "OPENCLAW_STATE_DIR",
      "OPENCLAW_CONFIG_PATH",
    ],
  },
  {
    icon: KeyRound,
    title: "Secrets (BYOK + Canal)",
    bullets: [
      "Provider API Key (OpenAI/Anthropic)",
      "Telegram Bot Token",
      "Telegram Chat ID",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Operação & Segurança",
    bullets: [
      "Separar credenciais por agente",
      "Registrar status de deploy/pagamento",
      "Logs/restart para troubleshooting",
    ],
  },
] as const;

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

          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Checklist de implantação
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Estrutura mínima para sair do zero até um agente OpenClaw operacional.
                </p>
              </div>
              <Link
                href="https://docs.openclaw.ai/start/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
              >
                Ver docs OpenClaw
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {setupChecklist.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            item.status === "required"
                              ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.status === "required" ? "Obrigatório" : "Recomendado"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="text-lg font-semibold text-white">
              Blueprint do dashboard (o que precisamos gerenciar)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Estrutura recomendada para configurar e operar OpenClaw com segurança.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {blueprintSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.title}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">
                        {section.title}
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

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
            <AgentDashboard />
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

          <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <h2 className="text-lg font-semibold text-indigo-200">
              O que falta evoluir depois (próximas features)
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-indigo-100/80">
              <li>Persistir perfil de deploy (host, runtime, envs) por agente</li>
              <li>Webhook de deploy com status em tempo real</li>
              <li>Healthcheck/uptime e métricas básicas</li>
              <li>Template de canais adicionais (WhatsApp/Discord)</li>
              <li>Versionamento de configuração e rollback</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h2 className="text-lg font-semibold text-emerald-200">
              Referência OpenClaw
            </h2>
            <div className="mt-3 space-y-2">
              <Link
                href="https://docs.openclaw.ai/start/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-black/20 px-3 py-2 text-sm text-emerald-100 hover:bg-black/30"
              >
                <span>Getting Started</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="https://docs.openclaw.ai/start/getting-started#before-you-start"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-black/20 px-3 py-2 text-sm text-emerald-100 hover:bg-black/30"
              >
                <span>Pré-requisitos</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
