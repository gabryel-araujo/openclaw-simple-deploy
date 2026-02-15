import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { createClient } from "@/src/infrastructure/auth/supabase";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
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
          Seu Perfil
        </h1>
        <p className="text-slate-400">
          Gerencie suas informações pessoais e configurações da conta.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-6 md:p-8">
        <ProfileForm user={session.user} />
      </div>
    </div>
  );
}
