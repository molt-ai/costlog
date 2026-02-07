'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ModelBreakdown } from '@/types';

interface ModelTableProps {
  data: ModelBreakdown[];
}

export function ModelTable({ data }: ModelTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-[#444] text-sm">
        No usage data yet. Sync to fetch your API usage.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#555] border-b border-white/[0.06]">
            <th className="pb-3 font-medium">Model</th>
            <th className="pb-3 font-medium text-right">Tokens</th>
            <th className="pb-3 font-medium text-right">Cost</th>
            <th className="pb-3 font-medium text-right w-24">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr 
              key={row.model} 
              className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      row.provider === 'openai' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[#e5e5e5]">{row.model}</span>
                </div>
              </td>
              <td className="py-3.5 text-right text-[#888] font-mono text-xs">
                {formatNumber(row.tokens)}
              </td>
              <td className="py-3.5 text-right font-mono text-xs">
                {formatCurrency(row.cost)}
              </td>
              <td className="py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        row.provider === 'openai' ? 'bg-emerald-500/60' : 'bg-amber-500/60'
                      }`}
                      style={{ width: `${Math.min(row.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-[#555] text-xs w-10 text-right">
                    {row.percentage.toFixed(0)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
