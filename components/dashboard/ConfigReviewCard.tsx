"use client";

import { AgentIcon } from "@/components/AgentIcon";
import { ChannelIcon, ChannelType } from "@/components/ChannelIcon";
import { ModelButton } from "@/components/ModelButton";
import { TelegramSetupModal } from "@/components/TelegramSetupModal";
import { Bot, Pencil, RefreshCw, Sparkles, X } from "lucide-react";
import { useState } from "react";

type ModelKey = "claude-opus" | "gpt-5.2" | "gemini-flash" | "llama-3.3-70b";

interface BotInfo {
  id: number;
  username: string;
  name: string;
}

interface ConfigReviewCardProps {
  model: ModelKey | null;
  channel: ChannelType | null;
  botInfo: BotInfo | null;
  onConfigChange: (updates: {
    model?: ModelKey;
    channel?: ChannelType;
  }) => void;
  onBotChange: (token: string, bot: BotInfo) => void;
}

const MODEL_OPTIONS: Array<{
  value: ModelKey;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "gpt-5.2", label: "GPT-5.2", icon: <AgentIcon agent="gpt" /> },
  {
    value: "claude-opus",
    label: "Claude Opus 4.5",
    icon: <AgentIcon agent="claude" />,
  },
  {
    value: "gemini-flash",
    label: "Gemini Flash",
    icon: <AgentIcon agent="gemini" />,
  },
  {
    value: "llama-3.3-70b",
    label: "Llama 3.3 70B",
    icon: <AgentIcon agent="llama" />,
  },
];

const CHANNEL_OPTIONS: Array<{
  value: ChannelType;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}> = [
  {
    value: "telegram",
    label: "Telegram",
    icon: <ChannelIcon channel="telegram" />,
  },
  {
    value: "discord",
    label: "Discord",
    icon: <ChannelIcon channel="discord" />,
    disabled: true,
    badge: "Em breve",
  },
  {
    value: "whatsapp",
    label: "Whatsapp",
    icon: <ChannelIcon channel="whatsapp" />,
    disabled: true,
    badge: "Em breve",
  },
];

function getModelDisplay(model: ModelKey | null) {
  return MODEL_OPTIONS.find((o) => o.value === model) ?? null;
}

function getChannelDisplay(channel: ChannelType | null) {
  return CHANNEL_OPTIONS.find((o) => o.value === channel) ?? null;
}

export function ConfigReviewCard({
  model,
  channel,
  botInfo,
  onConfigChange,
  onBotChange,
}: ConfigReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editModel, setEditModel] = useState<ModelKey | null>(model);
  const [editChannel, setEditChannel] = useState<ChannelType | null>(channel);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const modelDisplay = getModelDisplay(model);
  const channelDisplay = getChannelDisplay(channel);

  const handleSave = () => {
    onConfigChange({
      model: editModel ?? undefined,
      channel: editChannel ?? undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditModel(model);
    setEditChannel(channel);
    setIsEditing(false);
  };

  const handleBotConfirm = (token: string, bot: BotInfo) => {
    onBotChange(token, bot);
    setShowTelegramModal(false);
  };

  if (isEditing) {
    return (
      <>
        <div className="glass rounded-2xl p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">
                Editar configurações
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Model selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">
                Modelo de IA
              </p>
              <ModelButton
                name="edit-model-group"
                value={editModel ?? ""}
                onChange={(v) => setEditModel(v as ModelKey)}
                options={MODEL_OPTIONS}
              />
            </div>

            {/* Channel selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">
                Canal de mensagens
              </p>
              <ModelButton
                name="edit-channel-group"
                value={editChannel ?? ""}
                onChange={(v) => setEditChannel(v as ChannelType)}
                options={CHANNEL_OPTIONS}
              />
            </div>

            {/* Bot configuration */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">
                Bot do Telegram
              </p>
              {botInfo ? (
                <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                  <Bot className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="text-sm">
                    <span className="text-emerald-300 font-semibold">
                      {botInfo.name}
                    </span>
                    <span className="text-emerald-400/60 ml-1.5">
                      @{botInfo.username}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTelegramModal(true)}
                    className="ml-2 text-emerald-500/50 hover:text-emerald-300 transition-colors"
                    title="Reconfigurar bot"
                  >
                    <RefreshCw className="h-3.5 w-3.5 cursor-pointer" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTelegramModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  Configurar Bot do Telegram
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-cyan-300"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>

        {/* Telegram Setup Modal */}
        {showTelegramModal && (
          <TelegramSetupModal
            onConfirm={handleBotConfirm}
            onClose={() => setShowTelegramModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-slideUp">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            Configuração do deploy
          </h3>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white hover:border-slate-600"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Model */}
        <div className="group rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 transition-all hover:border-cyan-500/20 hover:bg-slate-950/60">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">
            Modelo de IA
          </p>
          <div className="flex items-center gap-2.5">
            {modelDisplay?.icon && (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-white/5 [&>svg]:h-5 [&>svg]:w-5">
                {modelDisplay.icon}
              </span>
            )}
            <span className="text-sm font-semibold text-white">
              {modelDisplay?.label ?? "Não selecionado"}
            </span>
          </div>
        </div>

        {/* Channel */}
        <div className="group rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 transition-all hover:border-cyan-500/20 hover:bg-slate-950/60">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">
            Canal
          </p>
          <div className="flex items-center gap-2.5">
            {channelDisplay?.icon && (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-white/5 [&>svg]:h-5 [&>svg]:w-5">
                {channelDisplay.icon}
              </span>
            )}
            <span className="text-sm font-semibold text-white">
              {channelDisplay?.label ?? "Não selecionado"}
            </span>
          </div>
        </div>

        {/* Bot */}
        <div className="group rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 transition-all hover:border-cyan-500/20 hover:bg-slate-950/60">
          <p className="mb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500">
            Bot do Telegram
          </p>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-white/5">
              <Bot className="h-5 w-5 text-sky-400" />
            </span>
            {botInfo ? (
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-white truncate">
                  {botInfo.name}
                </span>
                <span className="block text-xs text-slate-400 truncate">
                  @{botInfo.username}
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-500">Não configurado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
