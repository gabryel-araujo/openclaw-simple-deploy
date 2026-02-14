
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bot, 
  CreditCard, 
  Settings, 
  LogOut 
} from "lucide-react";
import { createClient } from "@/src/infrastructure/auth/client";
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl transition-transform sm:translate-x-0">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-10 px-2 mt-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
            <span className="self-center text-xl font-semibold whitespace-nowrap text-white tracking-wide">
              SimpleClaw
            </span>
          </Link>
        </div>
        
        <ul className="space-y-2 font-medium flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-lg p-3 group transition-all duration-200 ${
                    isActive 
                      ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)] border border-cyan-500/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"}`} />
                  <span className="ms-3">{link.label}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-slate-800 pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg p-3 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-400" />
            <span className="ms-3">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
