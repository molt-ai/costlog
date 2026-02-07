'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Trash2, Check, ExternalLink, Zap, Copy, ChevronRight } from 'lucide-react';
import { storage } from '@/lib/storage';
import type { Provider } from '@/types';

const PROVIDER_CONFIG = {
  openai: {
    name: 'OpenAI',
    color: 'emerald',
    placeholder: 'sk-admin-...',
    keyUrl: 'https://platform.openai.com/settings/organization/admin-keys',
    steps: [
      'Click the link below to open OpenAI Admin Keys',
      'Click "Create new admin key"',
      'Name it "CostLog" and click Create',
      'Copy the key and paste it here',
    ],
    note: 'Requires an Admin Key (not a regular API key) to access usage data.',
  },
  anthropic: {
    name: 'Anthropic',
    color: 'amber',
    placeholder: 'sk-ant-admin-...',
    keyUrl: 'https://console.anthropic.com/settings/admin-keys',
    steps: [
      'Click the link below to open Anthropic Console',
      'Go to Settings → Admin API Keys',
      'Click "Create Key" with Usage permissions',
      'Copy the key and paste it here',
    ],
    note: 'Requires an Admin Key with Usage & Cost permissions.',
  },
};

type ProviderId = keyof typeof PROVIDER_CONFIG;

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [activeSetup, setActiveSetup] = useState<ProviderId | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProviders(storage.getProviders());
  }, []);

  const addProvider = (providerId: ProviderId) => {
    if (!newApiKey) return;
    
    const config = PROVIDER_CONFIG[providerId];
    const provider: Provider = {
      id: providerId,
      name: config.name,
      apiKey: newApiKey,
      enabled: true,
    };

    storage.saveProvider(provider);
    setProviders(storage.getProviders());
    setNewApiKey('');
    setActiveSetup(null);
    flashSaved();
  };

  const toggleProvider = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      storage.saveProvider({ ...provider, enabled: !provider.enabled });
      setProviders(storage.getProviders());
    }
  };

  const removeProvider = (id: string) => {
    storage.removeProvider(id);
    setProviders(storage.getProviders());
  };

  const toggleShowKey = (id: string) => {
    const next = new Set(showKeys);
    next.has(id) ? next.delete(id) : next.add(id);
    setShowKeys(next);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const existingIds = new Set(providers.map(p => p.id));
  const availableProviders = (Object.keys(PROVIDER_CONFIG) as ProviderId[]).filter(id => !existingIds.has(id));

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="p-1.5 -ml-1.5 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px]">Settings</span>
          </div>
          {saved && (
            <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-8">
        {/* Connected Providers */}
        {providers.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
              Connected
            </h2>
            <div className="space-y-2">
              {providers.map((provider) => {
                const config = PROVIDER_CONFIG[provider.id as ProviderId];
                return (
                  <div key={provider.id} className="card p-4 flex items-center gap-3">
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        provider.enabled ? 'bg-blue-500 border-blue-500' : 'border-[#333] hover:border-[#444]'
                      }`}
                    >
                      {provider.enabled && <Check className="w-3 h-3 text-white" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          config?.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                      <p className="text-[#444] text-xs font-mono mt-0.5 truncate">
                        {showKeys.has(provider.id) ? provider.apiKey : provider.apiKey.slice(0, 12) + '••••••••'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => toggleShowKey(provider.id)}
                      className="p-2 text-[#444] hover:text-white rounded-lg hover:bg-white/[0.05]"
                    >
                      {showKeys.has(provider.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => removeProvider(provider.id)}
                      className="p-2 text-[#444] hover:text-red-400 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Add Providers */}
        {availableProviders.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
              {providers.length > 0 ? 'Add Another' : 'Connect a Provider'}
            </h2>
            
            <div className="space-y-3">
              {availableProviders.map((providerId) => {
                const config = PROVIDER_CONFIG[providerId];
                const isActive = activeSetup === providerId;
                
                return (
                  <div key={providerId} className="card overflow-hidden">
                    {/* Provider Header */}
                    <button
                      onClick={() => setActiveSetup(isActive ? null : providerId)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        config.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-medium text-sm">{config.name}</span>
                      <ChevronRight className={`w-4 h-4 text-[#444] ml-auto transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {/* Setup Flow */}
                    {isActive && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
                        <div className="pt-4">
                          <p className="text-xs text-[#888] mb-3">{config.note}</p>
                          
                          {/* Steps */}
                          <ol className="space-y-2 mb-4">
                            {config.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-[#666] flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-[#aaa]">{step}</span>
                              </li>
                            ))}
                          </ol>
                          
                          {/* One-Click Link - High contrast CTA */}
                          <a
                            href={config.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open {config.name} Admin Keys
                          </a>
                          
                          {/* Or copy URL */}
                          <button
                            onClick={() => copyToClipboard(config.keyUrl)}
                            className="w-full mt-2 py-2 text-xs text-[#666] hover:text-[#888] flex items-center justify-center gap-1.5"
                          >
                            <Copy className="w-3 h-3" />
                            {copied ? 'Copied!' : 'Copy link instead'}
                          </button>
                        </div>
                        
                        {/* Paste Key */}
                        <div className="pt-2 border-t border-white/[0.04]">
                          <label className="text-xs text-[#666] block mb-2">Paste your admin key</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={newApiKey}
                              onChange={(e) => setNewApiKey(e.target.value)}
                              placeholder={config.placeholder}
                              className="flex-1 px-3 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder-[#444] font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            />
                            <button
                              onClick={() => addProvider(providerId)}
                              disabled={!newApiKey}
                              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#222] disabled:text-[#555] text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Data Management */}
        <section>
          <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
            Data
          </h2>
          <button
            onClick={() => {
              if (confirm('Clear all usage data? This cannot be undone.')) {
                storage.clearUsage();
                window.location.reload();
              }
            }}
            className="px-3 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 hover:border-red-500/30 transition-colors"
          >
            Clear Usage Data
          </button>
        </section>
      </main>
    </div>
  );
}
