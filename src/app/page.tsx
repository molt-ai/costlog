'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, RefreshCw, Plus } from 'lucide-react';
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
    <div className="min-h-screen">
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium">CostLog</h1>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-xs text-neutral-500">
                Last sync: {lastSync}
              </span>
            )}
            {hasProviders && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 bg-neutral-800 rounded-lg hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
            <Link
              href="/settings"
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {!hasProviders ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">Connect your API providers to start tracking</p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-neutral-800 rounded-lg hover:bg-neutral-700"
            >
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

            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
              <h2 className="text-sm text-neutral-400 mb-4">Daily Spend</h2>
              <SpendChart data={dailySpend} />
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-neutral-500">OpenAI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-neutral-500">Anthropic</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
              <h2 className="text-sm text-neutral-400 mb-4">Cost by Model</h2>
              <ModelTable data={modelBreakdown} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
