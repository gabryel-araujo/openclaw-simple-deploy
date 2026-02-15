"use client";

import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { User } from "@supabase/supabase-js";
import { Camera, Loader2, Save, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: user.user_metadata?.full_name || "",
    email: user.email || "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName },
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      router.refresh();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao atualizar perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-center">
        <div className="relative group">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-32 w-32 rounded-full border-4 border-slate-800 object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500">
              <UserIcon className="h-16 w-16" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-slate-400 focus:outline-none cursor-not-allowed"
          />
          <p className="text-xs text-slate-500">
            O email não pode ser alterado.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-300"
          >
            Nome Completo
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            placeholder="Seu nome"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-black hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
