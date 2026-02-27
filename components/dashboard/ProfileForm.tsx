"use client";

import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Chrome,
  Loader2,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil",
      );
    } finally {
      setLoading(false);
    }
  };

  const provider = user.app_metadata?.provider ?? "email";
  const isGoogle = provider === "google";

  return (
    <div className="space-y-8 w-full mx-auto">
      {/* ── Avatar + Name ── */}

      <div className="flex">
        {/* ── Account Info Form ── */}
        <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-5 w-full">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Informações da conta
          </h2>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative group shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-4 border-slate-800 object-cover shadow-[0_0_24px_rgba(34,211,238,0.15)]"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shadow-inner">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
              {/* overlay – photo managed by Google */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-default">
                <Camera className="h-6 w-6 text-white/70" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-lg font-semibold text-white">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
              <p className="text-xs text-slate-600 mt-1">
                Foto gerenciada pela sua conta Google.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Email – read only */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-slate-400 focus:outline-none cursor-not-allowed text-sm"
              />
              <p className="text-xs text-slate-600">
                O email não pode ser alterado.
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-slate-300"
              >
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm"
                placeholder="Seu nome"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Security ── */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Segurança
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Provider */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-slate-700">
              {isGoogle ? (
                <Chrome className="h-4 w-4 text-sky-400" />
              ) : (
                <Shield className="h-4 w-4 text-slate-400" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-white">
                {isGoogle ? "Google OAuth" : provider}
              </p>
              <p className="text-xs text-slate-500">Método de autenticação</p>
            </div>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Ativo
            </span>
          </div>

          {/* Last login */}
          <div className="text-right">
            <p className="text-xs text-slate-500">Último acesso</p>
            <p className="text-sm text-slate-300 font-medium">
              {formatDate(user.last_sign_in_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
          <Shield className="h-3 w-3" />A senha é gerenciada pela sua conta
          Google — sem necessidade de senha local.
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Zona de perigo
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-300">Excluir conta</p>
            <p className="text-xs text-red-400/60 mt-0.5">
              Todos os seus agentes e dados serão removidos permanentemente.
            </p>
          </div>
          <button
            onClick={() =>
              toast("Esta funcionalidade estará disponível em breve.", {
                icon: "🚧",
              })
            }
            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            Excluir conta
          </button>
        </div>
      </section>
    </div>
  );
}
