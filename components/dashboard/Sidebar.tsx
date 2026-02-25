"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/src/infrastructure/auth/supabase-client";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/dashboard/agents", label: "Meus Agentes", icon: Bot },
    { href: "/dashboard/billing", label: "Cobrança", icon: CreditCard },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-xl transition-transform sm:translate-x-0">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-10 px-2 mt-4">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all group-hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] group-hover:scale-105" />
            <span className="self-center text-xl font-bold whitespace-nowrap text-white tracking-wide">
              Simple<span className="text-cyan-400">Claw</span>
            </span>
          </Link>
        </div>

        <ul className="space-y-1.5 font-medium flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-xl p-3 group transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.08)] border border-cyan-500/15"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-all duration-200 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-white group-hover:scale-110"}`}
                  />
                  <span className="ms-3 text-sm">{link.label}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-slate-800/60 pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-xl p-3 text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut className="h-5 w-5 transition-all duration-200 group-hover:text-red-400 group-hover:scale-110" />
            <span className="ms-3 text-sm">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
