"use client";

import { MessageSquare, Clock } from "lucide-react";

interface Chat {
  id: string;
  agentName: string;
  lastMessage: string;
  time: string;
  platform: "telegram" | "whatsapp" | "discord";
}

export function ActiveChatsWidget({ chats }: { chats: Chat[] }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          Conversas Ativas
        </h3>
        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
          Últimas 24h
        </span>
      </div>

      <div className="divide-y divide-slate-800/50">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="p-4 transition-colors hover:bg-slate-900/30 cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                {chat.agentName}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" />
                {chat.time}
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {chat.lastMessage}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                suppressHydrationWarning
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  chat.platform === "telegram"
                    ? "border-sky-500/20 text-sky-400 bg-sky-500/10"
                    : chat.platform === "whatsapp"
                      ? "border-green-500/20 text-green-400 bg-green-500/10"
                      : "border-indigo-500/20 text-indigo-400 bg-indigo-500/10"
                }`}
              >
                {chat.platform}
              </span>
            </div>
          </div>
        ))}
        {chats.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma conversa ativa no momento.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800/50 bg-slate-900/20">
        <button className="w-full text-xs text-slate-400 hover:text-white py-1 transition-colors">
          Ver todas as conversas
        </button>
      </div>
    </div>
  );
}
