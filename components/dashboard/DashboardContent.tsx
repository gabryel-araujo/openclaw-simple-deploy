"use client";

import { ConfigReviewCard } from "@/components/dashboard/ConfigReviewCard";
import { DeployWizard } from "@/components/dashboard/DeployWizard";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { ChannelType } from "@/components/ChannelIcon";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

const LS_MODEL_KEY = "brclaw:selected_model";
const LS_CHANNEL_KEY = "brclaw:selected_channel";
const LS_TELEGRAM_TOKEN_KEY = "brclaw:telegram_token";
const LS_TELEGRAM_BOT_KEY = "brclaw:telegram_bot";

export function DashboardContent({ user }: { user: User }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [model, setModel] = useState<ModelKey | null>(null);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramBot, setTelegramBot] = useState<BotInfo | null>(null);
  const router = useRouter();

  // Load persisted selections
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(LS_MODEL_KEY) as ModelKey | null;
      const savedChannel = localStorage.getItem(
        LS_CHANNEL_KEY,
      ) as ChannelType | null;
      const savedToken = localStorage.getItem(LS_TELEGRAM_TOKEN_KEY);
      const savedBot = localStorage.getItem(LS_TELEGRAM_BOT_KEY);

      if (savedModel) setModel(savedModel);
      if (savedChannel) setChannel(savedChannel);
      if (savedToken) setTelegramToken(savedToken);
      if (savedBot) {
        try {
          setTelegramBot(JSON.parse(savedBot));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* SSR guard */
    }
  }, []);

  const handleConfigChange = (updates: {
    model?: ModelKey;
    channel?: ChannelType;
  }) => {
    if (updates.model) {
      setModel(updates.model);
      localStorage.setItem(LS_MODEL_KEY, updates.model);
    }
    if (updates.channel) {
      setChannel(updates.channel);
      localStorage.setItem(LS_CHANNEL_KEY, updates.channel);
    }
    toast.success("Configurações atualizadas!");
  };

  const handleBotChange = (
    token: string,
    bot: { id: number; username: string; name: string },
  ) => {
    setTelegramToken(token);
    setTelegramBot(bot);
    localStorage.setItem(LS_TELEGRAM_TOKEN_KEY, token);
    localStorage.setItem(LS_TELEGRAM_BOT_KEY, JSON.stringify(bot));
    toast.success(`Bot @${bot.username} configurado!`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="animate-slideUp">
          <p className="text-sm text-slate-500">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie seu agente OpenClaw e faça deploys diretamente daqui.
          </p>
        </div>

        <div
          className="flex items-center gap-3"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 animate-slideUp">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plano ativo
          </span>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 p-1 pr-3 transition-all hover:bg-slate-700 hover:border-slate-600"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "User"}
                  className="h-8 w-8 rounded-full ring-2 ring-slate-700"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/30">
                  <span className="text-sm font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-200 md:block">
                {firstName}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right glass rounded-xl shadow-lg animate-scaleIn">
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
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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

      {/* ─── Config Review ─── */}
      <ConfigReviewCard
        model={model}
        channel={channel}
        botInfo={telegramBot}
        onConfigChange={handleConfigChange}
        onBotChange={handleBotChange}
      />

      {/* ─── Deploy Section ─── */}
      <DeployWizard
        user={user}
        model={model}
        channel={channel}
        telegramToken={telegramToken}
        telegramBot={telegramBot}
      />
    </div>
  );
}
