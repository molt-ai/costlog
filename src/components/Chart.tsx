'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailySpend } from '@/types';

interface ChartProps {
  data: DailySpend[];
}

export function SpendChart({ data }: ChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="openai" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="anthropic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'MMM d')}
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={{ stroke: '#333' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
            formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          />
          <Area
            type="monotone"
            dataKey="openai"
            stackId="1"
            stroke="#10b981"
            fill="url(#openai)"
            name="OpenAI"
          />
          <Area
            type="monotone"
            dataKey="anthropic"
            stackId="1"
            stroke="#f59e0b"
            fill="url(#anthropic)"
            name="Anthropic"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
