import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { createClient } from "@/src/infrastructure/auth/supabase";
import { redirect } from "next/navigation";

export default async function SettingsRoute() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Configurações
        </h1>
        <p className="text-slate-400">
          Gerencie as preferências do seu agente, integrações e notificações.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-6 md:p-8">
        <SettingsPage user={session.user} />
      </div>
    </div>
  );
}
