'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ModelBreakdown } from '@/types';

interface ModelTableProps {
  data: ModelBreakdown[];
}

export function ModelTable({ data }: ModelTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-600 text-sm">
        No usage data yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-800">
            <th className="pb-2 font-medium">Model</th>
            <th className="pb-2 font-medium text-right">Tokens</th>
            <th className="pb-2 font-medium text-right">Cost</th>
            <th className="pb-2 font-medium text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row) => (
            <tr key={row.model} className="border-b border-neutral-800/50">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      row.provider === 'openai' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-white">{row.model}</span>
                </div>
              </td>
              <td className="py-2.5 text-right text-neutral-400 font-mono">
                {formatNumber(row.tokens)}
              </td>
              <td className="py-2.5 text-right text-white font-mono">
                {formatCurrency(row.cost)}
              </td>
              <td className="py-2.5 text-right text-neutral-500">
                {row.percentage.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
