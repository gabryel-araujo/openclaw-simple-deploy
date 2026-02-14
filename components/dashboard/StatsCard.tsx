
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, icon: Icon, description, trend, trendUp }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-md transition-all hover:border-cyan-500/30 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/5 blur-xl transition-all group-hover:bg-cyan-500/10"></div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3 ring-1 ring-white/5">
          <Icon className="h-6 w-6 text-cyan-400" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend}
            </span>
          )}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
