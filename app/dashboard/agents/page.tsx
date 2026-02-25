import { AgentListPageWrapper } from "@/components/dashboard/AgentListPageWrapper";
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
      <div className="animate-slideUp">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Meus Agentes
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gerencie seus agentes: reinicie, veja logs, abra a interface e copie
          tokens.
        </p>
      </div>
      <AgentListPageWrapper userId={session.user.id} />
    </div>
  );
}
