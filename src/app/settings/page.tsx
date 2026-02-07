'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Trash2, Check, Plus, Zap } from 'lucide-react';
import { storage } from '@/lib/storage';
import type { Provider } from '@/types';

const PROVIDER_OPTIONS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', color: 'emerald' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', color: 'amber' },
];

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [newProvider, setNewProvider] = useState({ id: '', apiKey: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProviders(storage.getProviders());
  }, []);

  const addProvider = () => {
    if (!newProvider.id || !newProvider.apiKey) return;
    
    const option = PROVIDER_OPTIONS.find(p => p.id === newProvider.id);
    if (!option) return;

    const provider: Provider = {
      id: newProvider.id,
      name: option.name,
      apiKey: newProvider.apiKey,
      enabled: true,
    };

    storage.saveProvider(provider);
    setProviders(storage.getProviders());
    setNewProvider({ id: '', apiKey: '' });
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
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setShowKeys(next);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const existingIds = new Set(providers.map(p => p.id));
  const availableProviders = PROVIDER_OPTIONS.filter(p => !existingIds.has(p.id));

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
        <section>
          <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
            Connected Providers
          </h2>
          
          {providers.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-[#444] text-sm">No providers connected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => {
                const option = PROVIDER_OPTIONS.find(p => p.id === provider.id);
                return (
                  <div
                    key={provider.id}
                    className="card p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        provider.enabled
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-[#333] hover:border-[#444]'
                      }`}
                    >
                      {provider.enabled && <Check className="w-3 h-3 text-white" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          option?.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                      <p className="text-[#444] text-xs font-mono mt-0.5 truncate">
                        {showKeys.has(provider.id)
                          ? provider.apiKey
                          : provider.apiKey.slice(0, 12) + '••••••••'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => toggleShowKey(provider.id)}
                      className="p-2 text-[#444] hover:text-white rounded-lg hover:bg-white/[0.05]"
                    >
                      {showKeys.has(provider.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
          )}
        </section>

        {/* Add Provider */}
        {availableProviders.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-4">
              Add Provider
            </h2>
            
            <div className="card p-4 space-y-3">
              <select
                value={newProvider.id}
                onChange={(e) => setNewProvider({ ...newProvider, id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white focus:border-blue-500"
              >
                <option value="">Select provider</option>
                {availableProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              
              {newProvider.id && (
                <>
                  <input
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder={PROVIDER_OPTIONS.find(p => p.id === newProvider.id)?.placeholder}
                    className="w-full px-3 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder-[#444] font-mono focus:border-blue-500"
                  />
                  
                  <button
                    onClick={addProvider}
                    disabled={!newProvider.apiKey}
                    className="w-full btn btn-primary justify-center disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Provider
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* Danger Zone */}
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
