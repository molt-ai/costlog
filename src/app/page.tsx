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
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Track your AI spend</h2>
            <p className="text-[#888] text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Connect OpenAI or Anthropic in one click. See exactly where your API budget goes.
            </p>
            
            {/* Quick connect buttons - high contrast CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm rounded-xl transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white/80" />
                Connect OpenAI
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm rounded-xl transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-white/80" />
                Connect Anthropic
              </Link>
            </div>
            
            <p className="text-[#444] text-xs">
              Takes about 30 seconds. No credit card required.
            </p>
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
