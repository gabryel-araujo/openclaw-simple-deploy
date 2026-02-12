import { AgentDashboard } from "@/components/agent-dashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SimpleClaw BR</p>
        <h1 className="text-3xl font-semibold">Painel de Agentes</h1>
        <p className="mt-2 text-sm text-slate-300">
          MVP com Deploy 1-click no Railway + Telegram + BYOK.
        </p>
      </header>
      <AgentDashboard />
    </main>
  );
}
