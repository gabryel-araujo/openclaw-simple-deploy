import { AgentDashboard } from "@/components/agent-dashboard";
import { createClient } from "@/src/infrastructure/auth/supabase";
import { redirect } from "next/navigation";

export default async function AgentsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Meus Agentes
        </h1>
        <p className="mt-1 text-slate-400">
          Configure provider/model, aplique setup do OpenClaw e acompanhe logs.
        </p>
      </div>
      <AgentDashboard userId={session.user.id} />
    </div>
  );
}

