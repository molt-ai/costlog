'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, RefreshCw, Plus, TrendingUp, Zap } from 'lucide-react';
import { storage } from '@/lib/storage';
import { syncProvider } from '@/lib/providers';
import { getDailySpend, getModelBreakdown, getTotalSpend, getTodaySpend, getWeekSpend, getSpendByProvider } from '@/lib/utils';
import { SpendChart } from '@/components/Chart';
import { Stats } from '@/components/Stats';
import { ModelTable } from '@/components/ModelTable';
import type { UsageRecord, Provider } from '@/types';

export default function Dashboard() {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setUsage(storage.getUsage());
    setProviders(storage.getProviders());
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const enabledProviders = providers.filter(p => p.enabled);
    
    for (const provider of enabledProviders) {
      try {
        const records = await syncProvider(
          provider.id as 'openai' | 'anthropic',
          provider.apiKey
        );
        storage.saveUsage(records);
      } catch (e) {
        console.error(`Failed to sync ${provider.name}:`, e);
      }
    }
    
    setUsage(storage.getUsage());
    setLastSync(new Date().toLocaleTimeString());
    setSyncing(false);
  };

  const dailySpend = getDailySpend(usage, 30);
  const modelBreakdown = getModelBreakdown(usage);
  const total = getTotalSpend(usage);
  const today = getTodaySpend(usage);
  const week = getWeekSpend(usage);
  const byProvider = getSpendByProvider(usage);
  const hasProviders = providers.some(p => p.enabled);

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px]">CostLog</span>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSync && (
              <span className="text-xs text-[#666]">
                Synced {lastSync}
              </span>
            )}
            {hasProviders && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn btn-secondary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing' : 'Sync'}
              </button>
            )}
            <Link href="/settings" className="btn btn-secondary">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!hasProviders ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-[#171717] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <TrendingUp className="w-6 h-6 text-[#666]" />
            </div>
            <h2 className="text-lg font-medium mb-2">Track your AI costs</h2>
            <p className="text-[#666] text-sm mb-6 max-w-sm mx-auto">
              Connect your OpenAI or Anthropic account to see your API spend in one dashboard.
            </p>
            <Link href="/settings" className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Add Provider
            </Link>
          </div>
        ) : (
          <>
            <Stats
              total={total}
              today={today}
              week={week}
              openai={byProvider.openai}
              anthropic={byProvider.anthropic}
            />

            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-[#a1a1a1]">Daily Spend</h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[#666]">OpenAI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[#666]">Anthropic</span>
                  </div>
                </div>
              </div>
              <SpendChart data={dailySpend} />
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-medium text-[#a1a1a1] mb-4">Cost by Model</h2>
              <ModelTable data={modelBreakdown} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
