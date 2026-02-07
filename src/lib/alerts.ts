import { storage } from './storage';
import { getTodaySpend, getWeekSpend, getMonthSpend, detectAnomalies } from './utils';
import type { AlertRule, UsageRecord, Alert } from '@/types';

/**
 * Check all enabled alert rules against current usage
 * Returns triggered alerts
 */
export function checkAlertRules(usage: UsageRecord[]): Alert[] {
  const rules = storage.getAlertRules().filter(r => r.enabled);
  const triggeredAlerts: Alert[] = [];
  
  for (const rule of rules) {
    const triggered = evaluateRule(rule, usage);
    if (triggered) {
      // Check if already triggered recently (avoid spam)
      const existingAlerts = storage.getAlerts();
      const recentlyTriggered = existingAlerts.some(a => 
        a.message.includes(rule.id) && 
        new Date(a.date).getTime() > Date.now() - getDebounceMs(rule.period)
      );
      
      if (!recentlyTriggered) {
        const alert = createAlert(rule, triggered);
        storage.addAlert(alert);
        storage.updateAlertRuleLastTriggered(rule.id);
        triggeredAlerts.push({ ...alert, id: `temp-${Date.now()}`, date: new Date().toISOString(), read: false });
        
        // Dispatch notifications
        dispatchNotifications(rule, alert);
      }
    }
  }
  
  return triggeredAlerts;
}

function evaluateRule(rule: AlertRule, usage: UsageRecord[]): { value: number; threshold: number } | null {
  // Filter by provider if specified
  const filteredUsage = rule.provider && rule.provider !== 'all'
    ? usage.filter(u => u.provider === rule.provider)
    : usage;
  
  let currentValue: number;
  
  switch (rule.triggerType) {
    case 'spend_threshold': {
      switch (rule.period) {
        case 'daily':
          currentValue = getTodaySpend(filteredUsage);
          break;
        case 'weekly':
          currentValue = getWeekSpend(filteredUsage);
          break;
        case 'monthly':
        default:
          currentValue = getMonthSpend(filteredUsage);
          break;
      }
      break;
    }
    
    case 'spike': {
      const anomalies = detectAnomalies(filteredUsage);
      if (anomalies.length === 0) return null;
      const latest = anomalies[anomalies.length - 1];
      if (latest.percentageIncrease >= rule.threshold) {
        return { value: latest.percentageIncrease, threshold: rule.threshold };
      }
      return null;
    }
    
    case 'daily_limit': {
      currentValue = getTodaySpend(filteredUsage);
      break;
    }
    
    case 'model_limit': {
      if (!rule.model) return null;
      const modelUsage = filteredUsage.filter(u => u.model === rule.model);
      currentValue = modelUsage.reduce((sum, u) => sum + u.cost, 0);
      break;
    }
    
    default:
      return null;
  }
  
  if (currentValue >= rule.threshold) {
    return { value: currentValue, threshold: rule.threshold };
  }
  
  return null;
}

function getDebounceMs(period: 'daily' | 'weekly' | 'monthly'): number {
  switch (period) {
    case 'daily': return 4 * 60 * 60 * 1000; // 4 hours
    case 'weekly': return 24 * 60 * 60 * 1000; // 1 day
    case 'monthly': return 3 * 24 * 60 * 60 * 1000; // 3 days
    default: return 24 * 60 * 60 * 1000;
  }
}

function createAlert(rule: AlertRule, trigger: { value: number; threshold: number }): Omit<Alert, 'id' | 'date' | 'read'> {
  const periodLabel = rule.period === 'daily' ? 'Today' : rule.period === 'weekly' ? 'This week' : 'This month';
  const providerLabel = rule.provider === 'all' ? '' : ` (${rule.provider})`;
  
  let title: string;
  let message: string;
  let severity: 'info' | 'warning' | 'critical';
  
  switch (rule.triggerType) {
    case 'spend_threshold':
      title = `Budget Alert: ${rule.name}`;
      message = `${periodLabel}${providerLabel}: $${trigger.value.toFixed(2)} (threshold: $${trigger.threshold})`;
      severity = trigger.value >= trigger.threshold * 1.2 ? 'critical' : 'warning';
      break;
      
    case 'spike':
      title = `Spike Detected: ${rule.name}`;
      message = `Spend is ${trigger.value.toFixed(0)}% above average${providerLabel}`;
      severity = trigger.value >= 200 ? 'critical' : 'warning';
      break;
      
    case 'daily_limit':
      title = `Daily Limit Exceeded: ${rule.name}`;
      message = `Today's spend${providerLabel}: $${trigger.value.toFixed(2)} (limit: $${trigger.threshold})`;
      severity = 'warning';
      break;
      
    case 'model_limit':
      title = `Model Limit: ${rule.name}`;
      message = `${rule.model}${providerLabel}: $${trigger.value.toFixed(2)} (limit: $${trigger.threshold})`;
      severity = 'warning';
      break;
      
    default:
      title = rule.name;
      message = `Alert triggered: $${trigger.value.toFixed(2)}`;
      severity = 'info';
  }
  
  return { type: 'threshold', title, message, severity };
}

async function dispatchNotifications(rule: AlertRule, alert: Omit<Alert, 'id' | 'date' | 'read'>) {
  // Browser notification
  if (rule.channels.includes('browser') && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: rule.id, // Prevents duplicate notifications
      });
    }
  }
  
  // Slack notification
  if (rule.channels.includes('slack')) {
    const slackConfig = storage.getSlackConfig();
    if (slackConfig?.enabled && slackConfig.webhookUrl) {
      try {
        await sendSlackAlert(slackConfig.webhookUrl, alert);
      } catch (e) {
        console.error('Failed to send Slack alert:', e);
      }
    }
  }
  
  // Email notification (via API route)
  if (rule.channels.includes('email') && rule.recipients.length > 0) {
    const emails = rule.recipients.filter(r => r.type === 'email').map(r => r.value);
    if (emails.length > 0) {
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            recipients: emails,
            alert,
          }),
        });
      } catch (e) {
        console.error('Failed to send email alert:', e);
      }
    }
  }
  
  // Webhook notification
  if (rule.channels.includes('webhook')) {
    const webhooks = rule.recipients.filter(r => r.type === 'webhook').map(r => r.value);
    for (const url of webhooks) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'costlog.alert',
            timestamp: new Date().toISOString(),
            rule: {
              id: rule.id,
              name: rule.name,
              triggerType: rule.triggerType,
            },
            alert,
          }),
        });
      } catch (e) {
        console.error(`Failed to send webhook alert to ${url}:`, e);
      }
    }
  }
}

async function sendSlackAlert(webhookUrl: string, alert: Omit<Alert, 'id' | 'date' | 'read'>) {
  const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
  const color = alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${emoji} *${alert.title}*\n${alert.message}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `CostLog • ${new Date().toLocaleString()}`,
                },
              ],
            },
          ],
        },
      ],
    }),
  });
}
