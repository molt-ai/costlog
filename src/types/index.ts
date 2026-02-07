export interface Provider {
  id: string;
  name: string;
  apiKey: string;
  enabled: boolean;
}

export interface UsageRecord {
  id: string;
  provider: 'openai' | 'anthropic';
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  projectId?: string;
  projectName?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  provider: 'openai' | 'anthropic';
}

export interface DailySpend {
  date: string;
  openai: number;
  anthropic: number;
  total: number;
}

export interface ModelBreakdown {
  model: string;
  provider: 'openai' | 'anthropic';
  tokens: number;
  cost: number;
  percentage: number;
}

export interface Budget {
  monthlyLimit: number;
  alertThreshold: number; // percentage (0-100) to trigger alert
  alertsEnabled: boolean;
}

export interface Alert {
  id: string;
  type: 'threshold' | 'anomaly' | 'limit';
  title: string;
  message: string;
  date: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

export interface Anomaly {
  date: string;
  expectedSpend: number;
  actualSpend: number;
  percentageIncrease: number;
  provider?: 'openai' | 'anthropic';
  model?: string;
}

export interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  provider: 'openai' | 'anthropic';
  cost: number;
  tokens: number;
  percentage: number;
}

export interface ClaudeMaxConfig {
  orgId: string;
  sessionKey: string;
  enabled: boolean;
}

export interface ClaudeMaxOAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  orgId: string;
  enabled: boolean;
}

export interface ClaudeMaxUsage {
  fiveHour: {
    utilization: number;
    resetsAt: string | null;
  } | null;
  sevenDay: {
    utilization: number;
    resetsAt: string | null;
  } | null;
  lastUpdated: string;
}
