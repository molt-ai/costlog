import type { UsageRecord, DailySpend, ModelBreakdown } from '@/types';
import { format, subDays, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function getDailySpend(usage: UsageRecord[], days: number = 30): DailySpend[] {
  const result: DailySpend[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const dayUsage = usage.filter(u => u.date === date);
    
    const openai = dayUsage.filter(u => u.provider === 'openai').reduce((sum, u) => sum + u.cost, 0);
    const anthropic = dayUsage.filter(u => u.provider === 'anthropic').reduce((sum, u) => sum + u.cost, 0);
    
    result.push({
      date,
      openai,
      anthropic,
      total: openai + anthropic,
    });
  }
  
  return result;
}

export function getModelBreakdown(usage: UsageRecord[]): ModelBreakdown[] {
  const byModel = new Map<string, { tokens: number; cost: number; provider: string }>();
  
  for (const record of usage) {
    const key = record.model;
    const existing = byModel.get(key) || { tokens: 0, cost: 0, provider: record.provider };
    existing.tokens += record.inputTokens + record.outputTokens;
    existing.cost += record.cost;
    byModel.set(key, existing);
  }
  
  const totalCost = Array.from(byModel.values()).reduce((sum, m) => sum + m.cost, 0);
  
  return Array.from(byModel.entries())
    .map(([model, data]) => ({
      model,
      provider: data.provider,
      tokens: data.tokens,
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
}

export function getTotalSpend(usage: UsageRecord[]): number {
  return usage.reduce((sum, u) => sum + u.cost, 0);
}

export function getSpendByProvider(usage: UsageRecord[]): { openai: number; anthropic: number } {
  return {
    openai: usage.filter(u => u.provider === 'openai').reduce((sum, u) => sum + u.cost, 0),
    anthropic: usage.filter(u => u.provider === 'anthropic').reduce((sum, u) => sum + u.cost, 0),
  };
}

export function getTodaySpend(usage: UsageRecord[]): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  return usage.filter(u => u.date === today).reduce((sum, u) => sum + u.cost, 0);
}

export function getWeekSpend(usage: UsageRecord[]): number {
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  return usage.filter(u => u.date >= weekAgo).reduce((sum, u) => sum + u.cost, 0);
}
