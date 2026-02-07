'use client';

import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-xl font-medium text-white">{value}</p>
      {sub && <p className="text-xs text-neutral-600 mt-1">{sub}</p>}
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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard label="Total (30d)" value={formatCurrency(total)} />
      <StatCard label="Today" value={formatCurrency(today)} />
      <StatCard label="This Week" value={formatCurrency(week)} />
      <StatCard 
        label="OpenAI" 
        value={formatCurrency(openai)} 
        sub={total > 0 ? `${((openai / total) * 100).toFixed(0)}%` : undefined}
      />
      <StatCard 
        label="Anthropic" 
        value={formatCurrency(anthropic)}
        sub={total > 0 ? `${((anthropic / total) * 100).toFixed(0)}%` : undefined}
      />
    </div>
  );
}
