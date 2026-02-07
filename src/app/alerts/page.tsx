'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Bell, BellOff, Trash2, Edit2, Slack, Mail, Globe, Zap, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { storage } from '@/lib/storage';
import type { AlertRule, AlertTriggerType, AlertPeriod, AlertChannel } from '@/types';

const TRIGGER_TYPES: { value: AlertTriggerType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'spend_threshold', label: 'Spend Threshold', icon: <DollarSign className="w-4 h-4" />, description: 'Alert when spend exceeds amount' },
  { value: 'spike', label: 'Spike Detection', icon: <TrendingUp className="w-4 h-4" />, description: 'Alert when spend is X% above average' },
  { value: 'daily_limit', label: 'Daily Limit', icon: <AlertTriangle className="w-4 h-4" />, description: 'Alert when daily spend exceeds amount' },
  { value: 'model_limit', label: 'Model Limit', icon: <Zap className="w-4 h-4" />, description: 'Alert when specific model exceeds amount' },
];

const PERIODS: { value: AlertPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const CHANNELS: { value: AlertChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'browser', label: 'Browser', icon: <Bell className="w-4 h-4" /> },
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'slack', label: 'Slack', icon: <Slack className="w-4 h-4" /> },
  { value: 'webhook', label: 'Webhook', icon: <Globe className="w-4 h-4" /> },
];

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<AlertTriggerType>('spend_threshold');
  const [threshold, setThreshold] = useState(100);
  const [period, setPeriod] = useState<AlertPeriod>('monthly');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'all'>('all');
  const [channels, setChannels] = useState<AlertChannel[]>(['browser']);
  const [emailRecipients, setEmailRecipients] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRules(storage.getAlertRules());
    const slack = storage.getSlackConfig();
    setSlackConnected(!!slack?.enabled);
  };

  const resetForm = () => {
    setName('');
    setTriggerType('spend_threshold');
    setThreshold(100);
    setPeriod('monthly');
    setProvider('all');
    setChannels(['browser']);
    setEmailRecipients('');
    setEditingRule(null);
  };

  const openEditForm = (rule: AlertRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setTriggerType(rule.triggerType);
    setThreshold(rule.threshold);
    setPeriod(rule.period);
    setProvider(rule.provider || 'all');
    setChannels(rule.channels);
    setEmailRecipients(rule.recipients.filter(r => r.type === 'email').map(r => r.value).join(', '));
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipients = emailRecipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email)
      .map(email => ({
        id: `recipient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'email' as const,
        value: email,
      }));

    const rule: AlertRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: name || `${TRIGGER_TYPES.find(t => t.value === triggerType)?.label} Alert`,
      enabled: editingRule?.enabled ?? true,
      triggerType,
      threshold,
      period,
      provider,
      channels,
      recipients,
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      lastTriggered: editingRule?.lastTriggered,
    };

    storage.saveAlertRule(rule);
    loadData();
    setShowForm(false);
    resetForm();
  };

  const toggleRule = (rule: AlertRule) => {
    storage.saveAlertRule({ ...rule, enabled: !rule.enabled });
    loadData();
  };

  const deleteRule = (id: string) => {
    if (confirm('Delete this alert rule?')) {
      storage.removeAlertRule(id);
      loadData();
    }
  };

  const toggleChannel = (channel: AlertChannel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const formatThreshold = (rule: AlertRule) => {
    if (rule.triggerType === 'spike') {
      return `${rule.threshold}% above average`;
    }
    return `$${rule.threshold}`;
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold text-[15px]">Alert Rules</h1>
          </div>
          
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            New Alert
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Info Card */}
        <div className="card p-5 border-blue-500/20 bg-blue-500/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Get notified before it hurts</h3>
              <p className="text-xs text-[#888] leading-relaxed">
                Set up alerts to catch runaway costs, budget overruns, or unusual spending patterns before they become expensive problems.
              </p>
            </div>
          </div>
        </div>

        {/* Alert Rules List */}
        {rules.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-[#555]" />
            </div>
            <h2 className="text-sm font-medium mb-2">No alerts yet</h2>
            <p className="text-xs text-[#666] mb-6">Create your first alert to get notified about spending.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div 
                key={rule.id} 
                className={`card p-4 transition-all ${!rule.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      rule.enabled ? 'bg-orange-500/20' : 'bg-white/[0.03]'
                    }`}>
                      {TRIGGER_TYPES.find(t => t.value === rule.triggerType)?.icon || <Bell className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{rule.name}</h3>
                      <p className="text-xs text-[#666] mt-0.5">
                        {TRIGGER_TYPES.find(t => t.value === rule.triggerType)?.label} • {formatThreshold(rule)} • {rule.period}
                        {rule.provider !== 'all' && ` • ${rule.provider}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {rule.channels.map(channel => {
                          const ch = CHANNELS.find(c => c.value === channel);
                          return (
                            <span key={channel} className="flex items-center gap-1 text-[10px] text-[#555] bg-white/[0.03] px-2 py-0.5 rounded">
                              {ch?.icon}
                              {ch?.label}
                            </span>
                          );
                        })}
                        {rule.recipients.length > 0 && (
                          <span className="text-[10px] text-[#555]">
                            • {rule.recipients.length} recipient{rule.recipients.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.enabled 
                          ? 'text-orange-400 hover:bg-orange-500/10' 
                          : 'text-[#555] hover:bg-white/[0.05]'
                      }`}
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {rule.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditForm(rule)}
                      className="p-2 text-[#555] hover:text-white rounded-lg hover:bg-white/[0.05]"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-[#555] hover:text-red-400 rounded-lg hover:bg-white/[0.05]"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New/Edit Alert Form */}
        {showForm && (
          <div className="card p-6">
            <h2 className="text-sm font-medium mb-5">
              {editingRule ? 'Edit Alert' : 'New Alert Rule'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs text-[#888] mb-2">Alert Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Monthly Budget Warning"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm placeholder:text-[#444] focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-xs text-[#888] mb-2">Trigger Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTriggerType(type.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        triggerType === type.value
                          ? 'border-orange-500/50 bg-orange-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={triggerType === type.value ? 'text-orange-400' : 'text-[#666]'}>
                          {type.icon}
                        </span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                      <p className="text-[10px] text-[#666]">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] mb-2">
                    {triggerType === 'spike' ? 'Percentage Above Average' : 'Amount ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] text-sm">
                      {triggerType === 'spike' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      value={threshold}
                      onChange={e => setThreshold(Number(e.target.value))}
                      min={1}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-[#888] mb-2">Period</label>
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value as AlertPeriod)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    {PERIODS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-xs text-[#888] mb-2">Provider</label>
                <div className="flex gap-2">
                  {(['all', 'openai', 'anthropic'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                        provider === p
                          ? 'bg-white/[0.1] text-white'
                          : 'bg-white/[0.03] text-[#666] hover:bg-white/[0.05]'
                      }`}
                    >
                      {p === 'all' ? 'All Providers' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <label className="block text-xs text-[#888] mb-2">Notification Channels</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(channel => (
                    <button
                      key={channel.value}
                      type="button"
                      onClick={() => toggleChannel(channel.value)}
                      disabled={channel.value === 'slack' && !slackConnected}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        channels.includes(channel.value)
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-white/[0.03] text-[#666] border border-white/[0.06] hover:bg-white/[0.05]'
                      } ${channel.value === 'slack' && !slackConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {channel.icon}
                      {channel.label}
                      {channel.value === 'slack' && !slackConnected && (
                        <span className="text-[10px]">(not connected)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Recipients */}
              {channels.includes('email') && (
                <div>
                  <label className="block text-xs text-[#888] mb-2">Email Recipients</label>
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={e => setEmailRecipients(e.target.value)}
                    placeholder="email@example.com, team@example.com"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm placeholder:text-[#444] focus:outline-none focus:border-blue-500/50"
                  />
                  <p className="text-[10px] text-[#555] mt-1">Separate multiple emails with commas</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRule ? 'Save Changes' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slack Integration Promo */}
        {!slackConnected && (
          <div className="card p-5 border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Slack className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-1">Connect Slack</h3>
                <p className="text-xs text-[#888] mb-3">
                  Get alerts delivered directly to your Slack channel.
                </p>
                <Link href="/settings#slack" className="text-xs text-purple-400 hover:text-purple-300">
                  Set up Slack integration →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
