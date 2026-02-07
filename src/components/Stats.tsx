'use client';

import { formatCurrency } from '@/lib/utils';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: 'default' | 'green' | 'amber';
}

function StatCard({ label, value, sub, icon, accent = 'default' }: StatCardProps) {
  const accentColors = {
    default: 'from-blue-500/10 to-transparent',
    green: 'from-emerald-500/10 to-transparent',
    amber: 'from-amber-500/10 to-transparent',
  };

  return (
    <div className="stat-card card p-4 relative">
      <div className={`absolute inset-0 bg-gradient-to-b ${accentColors[accent]} opacity-0 hover:opacity-100 transition-opacity rounded-xl`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-[#444]">{icon}</span>}
          <span className="text-xs text-[#666] font-medium">{label}</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-[#555] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

interface StatsProps {
  total: number;
  today: number;
  week: number;
  openai: number;
  anthropic: number;
}

export function Stats({ total, today, week, openai, anthropic }: StatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard 
        label="Last 30 days" 
        value={formatCurrency(total)} 
        icon={<DollarSign className="w-3.5 h-3.5" />}
      />
      <StatCard 
        label="Today" 
        value={formatCurrency(today)}
        icon={<Calendar className="w-3.5 h-3.5" />}
      />
      <StatCard 
        label="This week" 
        value={formatCurrency(week)}
        icon={<TrendingUp className="w-3.5 h-3.5" />}
      />
      <StatCard 
        label="OpenAI" 
        value={formatCurrency(openai)} 
        sub={total > 0 ? `${((openai / total) * 100).toFixed(0)}% of total` : undefined}
        accent="green"
      />
      <StatCard 
        label="Anthropic" 
        value={formatCurrency(anthropic)}
        sub={total > 0 ? `${((anthropic / total) * 100).toFixed(0)}% of total` : undefined}
        accent="amber"
      />
    </div>
  );
}
