import { format, subDays, parseISO, startOfMonth, isAfter } from 'date-fns';
import type { UsageRecord, DailySpend, ModelBreakdown, Anomaly } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function getDailySpend(records: UsageRecord[], days: number = 30): DailySpend[] {
  const result: DailySpend[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayRecords = records.filter(r => r.date === date);
    
    const openai = dayRecords
      .filter(r => r.provider === 'openai')
      .reduce((sum, r) => sum + r.cost, 0);
    const anthropic = dayRecords
      .filter(r => r.provider === 'anthropic')
      .reduce((sum, r) => sum + r.cost, 0);
    
    result.push({ date, openai, anthropic, total: openai + anthropic });
  }
  
  return result;
}

export function getModelBreakdown(records: UsageRecord[]): ModelBreakdown[] {
  const byModel = new Map<string, { provider: 'openai' | 'anthropic'; tokens: number; cost: number }>();
  
  for (const r of records) {
    const key = r.model;
    const existing = byModel.get(key) || { provider: r.provider, tokens: 0, cost: 0 };
    byModel.set(key, {
      provider: r.provider,
      tokens: existing.tokens + r.inputTokens + r.outputTokens,
      cost: existing.cost + r.cost,
    });
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

export function getTotalSpend(records: UsageRecord[]): number {
  return records.reduce((sum, r) => sum + r.cost, 0);
}

export function getTodaySpend(records: UsageRecord[]): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  return records.filter(r => r.date === today).reduce((sum, r) => sum + r.cost, 0);
}

export function getWeekSpend(records: UsageRecord[]): number {
  const weekAgo = subDays(new Date(), 7);
  return records
    .filter(r => isAfter(parseISO(r.date), weekAgo))
    .reduce((sum, r) => sum + r.cost, 0);
}

export function getMonthSpend(records: UsageRecord[]): number {
  const monthStart = startOfMonth(new Date());
  return records
    .filter(r => isAfter(parseISO(r.date), monthStart) || r.date === format(monthStart, 'yyyy-MM-dd'))
    .reduce((sum, r) => sum + r.cost, 0);
}

export function getSpendByProvider(records: UsageRecord[]): { openai: number; anthropic: number } {
  const openai = records.filter(r => r.provider === 'openai').reduce((sum, r) => sum + r.cost, 0);
  const anthropic = records.filter(r => r.provider === 'anthropic').reduce((sum, r) => sum + r.cost, 0);
  return { openai, anthropic };
}

// Anomaly detection using simple statistical analysis
export function detectAnomalies(records: UsageRecord[], days: number = 14): Anomaly[] {
  const dailySpend = getDailySpend(records, days);
  const anomalies: Anomaly[] = [];
  
  if (dailySpend.length < 7) return anomalies;
  
  // Calculate rolling average (excluding last day)
  const recentDays = dailySpend.slice(0, -1);
  const totals = recentDays.map(d => d.total).filter(t => t > 0);
  
  if (totals.length < 3) return anomalies;
  
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const stdDev = Math.sqrt(
    totals.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / totals.length
  );
  
  // Check last 3 days for anomalies (> 2 standard deviations)
  const threshold = avg + (stdDev * 2);
  const checkDays = dailySpend.slice(-3);
  
  for (const day of checkDays) {
    if (day.total > threshold && day.total > avg * 1.5) {
      const percentageIncrease = ((day.total - avg) / avg) * 100;
      anomalies.push({
        date: day.date,
        expectedSpend: avg,
        actualSpend: day.total,
        percentageIncrease,
      });
    }
  }
  
  return anomalies;
}

// Export to CSV
export function exportToCSV(records: UsageRecord[]): string {
  const headers = ['Date', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Cost'];
  const rows = records
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(r => [
      r.date,
      r.provider,
      r.model,
      r.inputTokens.toString(),
      r.outputTokens.toString(),
      r.cost.toFixed(4),
    ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function downloadCSV(records: UsageRecord[]): void {
  const csv = exportToCSV(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `costlog-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
