import type { Provider, UsageRecord, Alert } from '@/types';

const KEYS = {
  providers: 'costlog-providers',
  usage: 'costlog-usage',
  alerts: 'costlog-alerts',
};

export const storage = {
  getProviders: (): Provider[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.providers);
    return data ? JSON.parse(data) : [];
  },

  saveProvider: (provider: Provider) => {
    const providers = storage.getProviders();
    const index = providers.findIndex(p => p.id === provider.id);
    if (index >= 0) {
      providers[index] = provider;
    } else {
      providers.push(provider);
    }
    localStorage.setItem(KEYS.providers, JSON.stringify(providers));
  },

  removeProvider: (id: string) => {
    const providers = storage.getProviders().filter(p => p.id !== id);
    localStorage.setItem(KEYS.providers, JSON.stringify(providers));
  },

  getUsage: (): UsageRecord[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.usage);
    return data ? JSON.parse(data) : [];
  },

  saveUsage: (records: UsageRecord[]) => {
    const existing = storage.getUsage();
    const existingIds = new Set(existing.map(r => r.id));
    const newRecords = records.filter(r => !existingIds.has(r.id));
    localStorage.setItem(KEYS.usage, JSON.stringify([...existing, ...newRecords]));
  },

  clearUsage: () => {
    localStorage.setItem(KEYS.usage, JSON.stringify([]));
  },

  getAlerts: (): Alert[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.alerts);
    return data ? JSON.parse(data) : [];
  },

  saveAlert: (alert: Alert) => {
    const alerts = storage.getAlerts();
    const index = alerts.findIndex(a => a.id === alert.id);
    if (index >= 0) {
      alerts[index] = alert;
    } else {
      alerts.push(alert);
    }
    localStorage.setItem(KEYS.alerts, JSON.stringify(alerts));
  },
};
