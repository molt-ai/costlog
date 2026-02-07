export interface Provider {
  id: string;
  name: string;
  apiKey: string;
  enabled: boolean;
  lastSync?: string;
}

export interface UsageRecord {
  id: string;
  provider: 'openai' | 'anthropic';
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  project?: string;
}

export interface DailySpend {
  date: string;
  openai: number;
  anthropic: number;
  total: number;
}

export interface ModelBreakdown {
  model: string;
  provider: string;
  tokens: number;
  cost: number;
  percentage: number;
}

export interface Alert {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  threshold: number;
  enabled: boolean;
  notifyEmail?: string;
  notifySlack?: string;
}
