
"use client";

import { ActiveChatsWidget } from "@/components/dashboard/ActiveChatsWidget";
import { InstanceCard } from "@/components/dashboard/InstanceCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Bot, CreditCard, MessageSquare, Zap } from "lucide-react";

export default function DashboardPage() {
  // Mock Data
  const instances = [
    {
      id: "1",
      name: "Atendente Loja",
      model: "GPT-4o",
      status: "RUNNING" as const,
      uptime: "2d 4h 12m",
      cpu: "12%",
      memory: "256MB",
    },
    {
      id: "2",
      name: "Suporte Técnico",
      model: "Claude 3.5 Sonnet",
      status: "STOPPED" as const,
      uptime: "0m",
      cpu: "0%",
      memory: "0MB",
    },
    {
      id: "3",
      name: "Vendas WhatsApp",
      model: "Gemini 1.5 Flash",
      status: "DEPLOYING" as const,
      uptime: "0m",
      cpu: "45%",
      memory: "128MB",
    },
  ];

  const recentChats = [
    {
      id: "c1",
      agentName: "Atendente Loja",
      lastMessage: "O cliente perguntou sobre o prazo de entrega para o CEP 01000-000.",
      time: "2 min atrás",
      platform: "telegram" as const,
    },
    {
      id: "c2",
      agentName: "Atendente Loja",
      lastMessage: "Confirmado o pagamento do pedido #1234. Iniciando processo de envio.",
      time: "15 min atrás",
      platform: "telegram" as const,
    },
    {
      id: "c3",
      agentName: "Vendas WhatsApp",
      lastMessage: "Cliente interessado no plano anual. Enviei a proposta comercial.",
      time: "1h atrás",
      platform: "whatsapp" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400">Bem-vindo de volta! Aqui está o resumo dos seus agentes.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Plano Pro Ativo
           </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Créditos Disponíveis"
          value="R$ 14,50"
          icon={CreditCard}
          description="Renova em 12 dias"
          trend="- R$ 2,50 hoje"
        />
        <StatsCard
          title="Agentes Ativos"
          value="2"
          icon={Bot}
          description="De 5 permitidos"
          trend="+1 essa semana"
          trendUp={true}
        />
        <StatsCard
          title="Mensagens Hoje"
          value="1,234"
          icon={MessageSquare}
          description="Média de 45/hora"
          trend="+12% que ontem"
          trendUp={true}
        />
        <StatsCard
          title="Uptime Geral"
          value="99.9%"
          icon={Zap}
          description="Últimos 30 dias"
          trend="Estável"
          trendUp={true}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Instances */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Seus Agentes</h2>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              + Novo Agente
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {instances.map((instance) => (
              <InstanceCard key={instance.id} instance={instance} />
            ))}
            
            {/* Add New Card Placeholder */}
            <button className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30 transition-all hover:border-cyan-500/50 hover:bg-slate-900/50 group">
              <div className="rounded-full bg-slate-900 p-4 transition-all group-hover:bg-cyan-500/10 group-hover:ring-1 group-hover:ring-cyan-500/50">
                <Bot className="h-8 w-8 text-slate-600 transition-colors group-hover:text-cyan-400" />
              </div>
              <p className="mt-4 font-medium text-slate-500 transition-colors group-hover:text-cyan-400">
                Criar Novo Agente
              </p>
            </button>
          </div>
        </div>

        {/* Sidebar Widget - Active Chats */}
        <div className="space-y-6">
          <ActiveChatsWidget chats={recentChats} />
          
          {/* Tips Widget or something else */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-indigo-300">
              <Zap className="h-4 w-4" />
              Dica Pro
            </h3>
            <p className="mt-2 text-sm text-indigo-200/70">
              Conecte seu WhatsApp Business para aumentar o engajamento em até 40%.
            </p>
            <button className="mt-4 w-full rounded-lg bg-indigo-500/20 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors">
              Conectar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
