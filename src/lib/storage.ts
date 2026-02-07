import type { Provider, UsageRecord, Budget, Alert, ClaudeMaxConfig, ClaudeMaxUsage, ClaudeMaxOAuth } from '@/types';

const KEYS = {
  providers: 'costlog_providers',
  usage: 'costlog_usage',
  budget: 'costlog_budget',
  alerts: 'costlog_alerts',
  claudeMax: 'costlog_claude_max',
  claudeMaxUsage: 'costlog_claude_max_usage',
  claudeMaxOAuth: 'costlog_claude_max_oauth',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const storage = {
  // Providers
  getProviders: (): Provider[] => safeGet(KEYS.providers, []),
  
  saveProvider: (provider: Provider): void => {
    const providers = storage.getProviders();
    const idx = providers.findIndex(p => p.id === provider.id);
    if (idx >= 0) {
      providers[idx] = provider;
    } else {
      providers.push(provider);
    }
    safeSet(KEYS.providers, providers);
  },
  
  removeProvider: (id: string): void => {
    const providers = storage.getProviders().filter(p => p.id !== id);
    safeSet(KEYS.providers, providers);
  },

  // Usage
  getUsage: (): UsageRecord[] => safeGet(KEYS.usage, []),
  
  saveUsage: (records: UsageRecord[]): void => {
    const existing = storage.getUsage();
    const existingIds = new Set(existing.map(r => r.id));
    const newRecords = records.filter(r => !existingIds.has(r.id));
    safeSet(KEYS.usage, [...existing, ...newRecords]);
  },
  
  clearUsage: (): void => {
    safeSet(KEYS.usage, []);
  },

  // Budget
  getBudget: (): Budget => safeGet(KEYS.budget, {
    monthlyLimit: 100,
    alertThreshold: 80,
    alertsEnabled: true,
  }),
  
  saveBudget: (budget: Budget): void => {
    safeSet(KEYS.budget, budget);
  },

  // Alerts
  getAlerts: (): Alert[] => safeGet(KEYS.alerts, []),
  
  addAlert: (alert: Omit<Alert, 'id' | 'date' | 'read'>): void => {
    const alerts = storage.getAlerts();
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    };
    safeSet(KEYS.alerts, [newAlert, ...alerts].slice(0, 50)); // Keep last 50
  },
  
  markAlertRead: (id: string): void => {
    const alerts = storage.getAlerts().map(a => 
      a.id === id ? { ...a, read: true } : a
    );
    safeSet(KEYS.alerts, alerts);
  },
  
  clearAlerts: (): void => {
    safeSet(KEYS.alerts, []);
  },

  // Claude Max
  getClaudeMaxConfig: (): ClaudeMaxConfig | null => safeGet(KEYS.claudeMax, null),
  
  saveClaudeMaxConfig: (config: ClaudeMaxConfig): void => {
    safeSet(KEYS.claudeMax, config);
  },
  
  removeClaudeMaxConfig: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.claudeMax);
    localStorage.removeItem(KEYS.claudeMaxUsage);
  },

  getClaudeMaxUsage: (): ClaudeMaxUsage | null => safeGet(KEYS.claudeMaxUsage, null),
  
  saveClaudeMaxUsage: (usage: ClaudeMaxUsage): void => {
    safeSet(KEYS.claudeMaxUsage, usage);
  },

  // Claude Max OAuth
  getClaudeMaxOAuth: (): ClaudeMaxOAuth | null => safeGet(KEYS.claudeMaxOAuth, null),
  
  saveClaudeMaxOAuth: (oauth: ClaudeMaxOAuth): void => {
    safeSet(KEYS.claudeMaxOAuth, oauth);
  },
  
  removeClaudeMaxOAuth: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.claudeMaxOAuth);
    localStorage.removeItem(KEYS.claudeMaxUsage);
  },
};
