'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { storage } from '@/lib/storage';
import type { ClaudeMaxUsage } from '@/types';

function formatTimeRemaining(resetTime: string | null): string {
  if (!resetTime) return '--';
  
  const now = Date.now();
  const reset = new Date(resetTime).getTime();
  const diff = reset - now;
  
  if (diff <= 0) return 'Resetting...';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

function UsageBar({ label, utilization, resetsAt, warning }: { 
  label: string; 
  utilization: number; 
  resetsAt: string | null;
  warning: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(resetsAt));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(resetsAt));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [resetsAt]);

  const getBarColor = () => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 75) return 'bg-amber-500';
    return 'bg-purple-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#888] flex items-center gap-1.5">
          {warning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className={`font-mono ${utilization >= 90 ? 'text-red-400' : utilization >= 75 ? 'text-amber-400' : 'text-white'}`}>
            {utilization.toFixed(1)}%
          </span>
          <span className="text-[#555] flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </span>
        </div>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${Math.min(100, utilization)}%` }}
        />
      </div>
    </div>
  );
}

export default function ClaudeMaxCard() {
  const [usage, setUsage] = useState<ClaudeMaxUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState(false);

  const fetchUsage = useCallback(async () => {
    const config = storage.getClaudeMaxConfig();
    if (!config || !config.enabled) {
      setHasConfig(false);
      return;
    }
    
    setHasConfig(true);
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/claude-max', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: config.orgId,
          sessionKey: config.sessionKey,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      
      const data = await res.json();
      setUsage(data);
      storage.saveClaudeMaxUsage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch usage');
      // Try to use cached data
      const cached = storage.getClaudeMaxUsage();
      if (cached) setUsage(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load cached data immediately
    const cached = storage.getClaudeMaxUsage();
    if (cached) setUsage(cached);
    
    // Check if configured
    const config = storage.getClaudeMaxConfig();
    setHasConfig(!!config?.enabled);
    
    // Fetch fresh data
    fetchUsage();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (!hasConfig) {
    return null;
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Claude Max</h3>
            <p className="text-xs text-[#555]">Subscription usage</p>
          </div>
        </div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="p-2 text-[#555] hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && !usage && (
        <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {usage && (
        <div className="space-y-4">
          {usage.fiveHour && (
            <UsageBar 
              label="5-Hour Window" 
              utilization={usage.fiveHour.utilization}
              resetsAt={usage.fiveHour.resetsAt}
              warning={usage.fiveHour.utilization >= 75}
            />
          )}
          
          {usage.sevenDay && (
            <UsageBar 
              label="Weekly Limit" 
              utilization={usage.sevenDay.utilization}
              resetsAt={usage.sevenDay.resetsAt}
              warning={usage.sevenDay.utilization >= 75}
            />
          )}
          
          {usage.lastUpdated && (
            <p className="text-xs text-[#444] text-right">
              Updated {new Date(usage.lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
