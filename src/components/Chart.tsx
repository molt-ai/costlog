'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailySpend } from '@/types';

interface ChartProps {
  data: DailySpend[];
}

export function SpendChart({ data }: ChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="openai" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="anthropic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'MMM d')}
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#888', marginBottom: '4px' }}
            itemStyle={{ color: '#fff', padding: '2px 0' }}
            labelFormatter={(d) => format(parseISO(d as string), 'MMMM d, yyyy')}
            formatter={(value, name) => [
              `$${(value as number).toFixed(2)}`,
              name === 'openai' ? 'OpenAI' : 'Anthropic'
            ]}
          />
          <Area
            type="monotone"
            dataKey="openai"
            stackId="1"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#openai)"
            name="openai"
          />
          <Area
            type="monotone"
            dataKey="anthropic"
            stackId="1"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="url(#anthropic)"
            name="anthropic"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
