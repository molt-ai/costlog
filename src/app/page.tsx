'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Settings, RefreshCw, TrendingUp, Zap, Download, Bell } from 'lucide-react';
import { differenceInDays, endOfMonth } from 'date-fns';
import { storage } from '@/lib/storage';
import { syncProvider } from '@/lib/providers';
import {
  getDailySpend,
  getModelBreakdown,
  getProjectBreakdown,
  getTotalSpend,
  getTodaySpend,
  getWeekSpend,
  getMonthSpend,
  getSpendByProvider,
  detectAnomalies,
  downloadCSV,
} from '@/lib/utils';
import { checkAlertRules } from '@/lib/alerts';
import { SpendChart } from '@/components/Chart';
import { Stats } from '@/components/Stats';
import { ModelTable } from '@/components/ModelTable';
import { ProjectTable } from '@/components/ProjectTable';
import { BudgetCard } from '@/components/BudgetCard';
import { AnomalyBanner } from '@/components/AnomalyBanner';
import { AlertsDropdown } from '@/components/AlertsDropdown';
import { ShareCard } from '@/components/ShareCard';
import ClaudeMaxCard from '@/components/ClaudeMaxCard';
import type { UsageRecord, Provider, Budget, Alert, Anomaly } from '@/types';

export default function Dashboard() {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthlyLimit: 100, alertThreshold: 80, alertsEnabled: true });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [showAnomaly, setShowAnomaly] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const usageData = storage.getUsage();
    const currentBudget = storage.getBudget();
    setUsage(usageData);
    setProviders(storage.getProviders());
    setBudget(currentBudget);
    setAlerts(storage.getAlerts());
    setAnomalies(detectAnomalies(usageData));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkForAlerts = useCallback((usageData: UsageRecord[], currentBudget: Budget) => {
    // Check custom alert rules
    const triggeredAlerts = checkAlertRules(usageData);
    
    // Legacy budget check
    const monthSpend = getMonthSpend(usageData);
    const percentage = (monthSpend / currentBudget.monthlyLimit) * 100;
    
    if (currentBudget.alertsEnabled && percentage >= currentBudget.alertThreshold) {
      const existingAlerts = storage.getAlerts();
      const today = new Date().toISOString().split('T')[0];
      const alreadyAlerted = existingAlerts.some(
        a => a.type === 'threshold' && a.date.startsWith(today)
      );
      
      if (!alreadyAlerted) {
        storage.addAlert({
          type: 'threshold',
          title: percentage >= 100 ? 'Budget exceeded!' : 'Budget warning',
          message: `You've used ${percentage.toFixed(0)}% of your monthly budget.`,
          severity: percentage >= 100 ? 'critical' : 'warning',
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('CostLog Budget Alert', {
            body: `You've used ${percentage.toFixed(0)}% of your monthly budget.`,
            icon: '/favicon.ico',
          });
        }
      }
    }
    
    // Check for anomalies
    const newAnomalies = detectAnomalies(usageData);
    if (newAnomalies.length > 0) {
      const latest = newAnomalies[newAnomalies.length - 1];
      const existingAlerts = storage.getAlerts();
      const alreadyAlerted = existingAlerts.some(
        a => a.type === 'anomaly' && a.message.includes(latest.date)
      );
      
      if (!alreadyAlerted) {
        storage.addAlert({
          type: 'anomaly',
          title: 'Unusual spend detected',
          message: `${latest.date}: ${latest.percentageIncrease.toFixed(0)}% higher than average.`,
          severity: 'warning',
        });
      }
    }
    
    return triggeredAlerts.length > 0 || newAnomalies.length > 0;
  }, []);

  const handleSync = useCallback(async () => {
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

    const usageData = storage.getUsage();
    const currentBudget = storage.getBudget();
    checkForAlerts(usageData, currentBudget);
    loadData();
    setLastSync(new Date().toLocaleTimeString());
    setSyncing(false);
  }, [providers, checkForAlerts, loadData]);

  const handleExport = useCallback(() => {
    downloadCSV(usage);
  }, [usage]);

  // Memoize computed values to avoid recalculation on every render
  const dailySpend = useMemo(() => getDailySpend(usage, 30), [usage]);
  const modelBreakdown = useMemo(() => getModelBreakdown(usage), [usage]);
  const projectBreakdown = useMemo(() => getProjectBreakdown(usage), [usage]);
  const stats = useMemo(() => ({
    total: getTotalSpend(usage),
    today: getTodaySpend(usage),
    week: getWeekSpend(usage),
    month: getMonthSpend(usage),
    byProvider: getSpendByProvider(usage),
  }), [usage]);
  
  const hasProviders = useMemo(() => providers.some(p => p.enabled), [providers]);
  const daysRemaining = useMemo(() => differenceInDays(endOfMonth(new Date()), new Date()), []);

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

          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-xs text-[#666] hidden sm:block">
                Synced {lastSync}
              </span>
            )}

            {hasProviders && (
              <>
                <AlertsDropdown alerts={alerts} onUpdate={loadData} />
                
                <ShareCard stats={stats} topModels={modelBreakdown.slice(0, 5)} />

                <button
                  onClick={handleExport}
                  className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn btn-secondary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{syncing ? 'Syncing' : 'Sync'}</span>
                </button>
              </>
            )}

            <Link href="/alerts" className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]" title="Alert Rules">
              <Bell className="w-4 h-4" />
            </Link>

            <Link href="/settings" className="btn btn-secondary">
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!hasProviders ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-9 h-9 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Stop guessing your AI costs</h1>
            <p className="text-[#888] text-base mb-8 max-w-lg mx-auto leading-relaxed">
              Connect your API in 30 seconds. Get real-time spend tracking, budget alerts, and cost breakdowns by model.
            </p>

            {/* Single focused CTA */}
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-base rounded-xl transition-colors shadow-lg shadow-orange-500/25"
            >
              Get Started Free
            </Link>
            
            <p className="text-[#555] text-sm mt-4">
              Free forever • No credit card • Works with OpenAI & Anthropic
            </p>
            
            {/* Social proof */}
            <div className="mt-12 pt-8 border-t border-white/[0.04]">
              <div className="flex items-center justify-center gap-8 text-sm text-[#666]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Budget alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Cost by model</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Anomaly Alert */}
            {showAnomaly && anomalies.length > 0 && (
              <AnomalyBanner
                anomalies={anomalies}
                onDismiss={() => setShowAnomaly(false)}
              />
            )}

            {/* Budget Card */}
            <BudgetCard
              spent={stats.month}
              budget={budget}
              daysRemaining={daysRemaining}
            />

            {/* Claude Max Card */}
            <ClaudeMaxCard />

            <Stats
              total={stats.total}
              today={stats.today}
              week={stats.week}
              openai={stats.byProvider.openai}
              anthropic={stats.byProvider.anthropic}
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

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-[#a1a1a1]">Cost by Model</h2>
                  <button
                    onClick={handleExport}
                    className="text-xs text-[#555] hover:text-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
                <ModelTable data={modelBreakdown} />
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-medium text-[#a1a1a1] mb-4">Cost by Project</h2>
                <ProjectTable data={projectBreakdown} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
