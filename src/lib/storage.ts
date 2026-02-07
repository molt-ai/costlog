import type { Provider, UsageRecord, Budget, Alert, ClaudeMaxConfig, ClaudeMaxUsage, ClaudeMaxOAuth, AlertRule, SlackConfig, TeamMember } from '@/types';

const KEYS = {
  providers: 'costlog_providers',
  usage: 'costlog_usage',
  budget: 'costlog_budget',
  alerts: 'costlog_alerts',
  alertRules: 'costlog_alert_rules',
  slackConfig: 'costlog_slack_config',
  teamMembers: 'costlog_team_members',
  claudeMax: 'costlog_claude_max',
  claudeMaxUsage: 'costlog_claude_max_usage',
  claudeMaxOAuth: 'costlog_claude_max_oauth',
} as const;

// Cache to reduce localStorage reads
const cache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL = 1000; // 1 second cache

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  // Check cache first
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value as T;
  }
  
  try {
    const val = localStorage.getItem(key);
    const result = val ? JSON.parse(val) : fallback;
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    cache.set(key, { value, timestamp: Date.now() });
  } catch (e) {
    console.error('Storage error:', e);
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
  cache.delete(key);
}

// Helper for CRUD on arrays with id field
function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const idx = items.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  return items;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter(i => i.id !== id);
}

export const storage = {
  // Providers
  getProviders: (): Provider[] => safeGet(KEYS.providers, []),
  
  saveProvider: (provider: Provider): void => {
    safeSet(KEYS.providers, upsertById(storage.getProviders(), provider));
  },
  
  removeProvider: (id: string): void => {
    safeSet(KEYS.providers, removeById(storage.getProviders(), id));
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
    safeRemove(KEYS.claudeMax);
    safeRemove(KEYS.claudeMaxUsage);
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
    safeRemove(KEYS.claudeMaxOAuth);
    safeRemove(KEYS.claudeMaxUsage);
  },

  // Alert Rules
  getAlertRules: (): AlertRule[] => safeGet(KEYS.alertRules, []),
  
  saveAlertRule: (rule: AlertRule): void => {
    safeSet(KEYS.alertRules, upsertById(storage.getAlertRules(), rule));
  },
  
  removeAlertRule: (id: string): void => {
    safeSet(KEYS.alertRules, removeById(storage.getAlertRules(), id));
  },
  
  updateAlertRuleLastTriggered: (id: string): void => {
    const rules = storage.getAlertRules().map(r => 
      r.id === id ? { ...r, lastTriggered: new Date().toISOString() } : r
    );
    safeSet(KEYS.alertRules, rules);
  },

  // Slack Config
  getSlackConfig: (): SlackConfig | null => safeGet(KEYS.slackConfig, null),
  
  saveSlackConfig: (config: SlackConfig): void => {
    safeSet(KEYS.slackConfig, config);
  },
  
  removeSlackConfig: (): void => {
    safeRemove(KEYS.slackConfig);
  },

  // Team Members
  getTeamMembers: (): TeamMember[] => safeGet(KEYS.teamMembers, []),
  
  saveTeamMember: (member: TeamMember): void => {
    safeSet(KEYS.teamMembers, upsertById(storage.getTeamMembers(), member));
  },
  
  removeTeamMember: (id: string): void => {
    safeSet(KEYS.teamMembers, removeById(storage.getTeamMembers(), id));
  },
  
  // Clear cache (useful for testing)
  clearCache: (): void => {
    cache.clear();
  },
};
