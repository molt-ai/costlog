'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ProjectBreakdown } from '@/types';

interface ProjectTableProps {
  data: ProjectBreakdown[];
}

export function ProjectTable({ data }: ProjectTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[#444] text-sm">
        No project data available. Projects are pulled from OpenAI and Anthropic workspaces.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#555] border-b border-white/[0.06]">
            <th className="pb-3 font-medium">Project</th>
            <th className="pb-3 font-medium text-right">Tokens</th>
            <th className="pb-3 font-medium text-right">Cost</th>
            <th className="pb-3 font-medium text-right w-24">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row) => (
            <tr 
              key={`${row.projectId}-${row.provider}`} 
              className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      row.provider === 'openai' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="text-[#e5e5e5]">{row.projectName}</span>
                    {row.projectId !== row.projectName && row.projectId !== 'default' && (
                      <span className="text-xs text-[#444] ml-2 font-mono">
                        {row.projectId.slice(0, 12)}...
                      </span>
                    )}
                  </div>
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
