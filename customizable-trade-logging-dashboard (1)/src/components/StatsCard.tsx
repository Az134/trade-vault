import type { } from 'react';
import { cn } from '../utils/cn';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'cyan';
}

const colorMap = {
  green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
  red: 'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
  yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
  cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
};

const iconBgMap = {
  green: 'bg-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/20 text-red-400',
  blue: 'bg-blue-500/20 text-blue-400',
  yellow: 'bg-amber-500/20 text-amber-400',
  purple: 'bg-purple-500/20 text-purple-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
};

export default function StatsCard({ title, value, icon: Icon, subtitle, color = 'blue' }: StatsCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg',
      colorMap[color]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBgMap[color])}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
