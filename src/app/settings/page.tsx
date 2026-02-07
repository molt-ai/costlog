'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Trash2, Check } from 'lucide-react';
import { storage } from '@/lib/storage';
import type { Provider } from '@/types';

const PROVIDER_OPTIONS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
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
    <div className="min-h-screen">
      <header className="border-b border-neutral-800">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-1.5 text-neutral-500 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-medium">Settings</h1>
          {saved && (
            <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm text-neutral-400 mb-4">Connected Providers</h2>
          
          {providers.length === 0 ? (
            <p className="text-neutral-600 text-sm py-4">No providers connected yet</p>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 p-3 bg-neutral-900 rounded-lg border border-neutral-800"
                >
                  <button
                    onClick={() => toggleProvider(provider.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      provider.enabled
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-neutral-600'
                    }`}
                  >
                    {provider.enabled && <Check className="w-3 h-3 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{provider.name}</p>
                    <p className="text-neutral-600 text-xs font-mono truncate">
                      {showKeys.has(provider.id)
                        ? provider.apiKey
                        : provider.apiKey.slice(0, 8) + '••••••••'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => toggleShowKey(provider.id)}
                    className="p-1.5 text-neutral-500 hover:text-white"
                  >
                    {showKeys.has(provider.id) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => removeProvider(provider.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {availableProviders.length > 0 && (
          <section>
            <h2 className="text-sm text-neutral-400 mb-4">Add Provider</h2>
            
            <div className="space-y-3">
              <select
                value={newProvider.id}
                onChange={(e) => setNewProvider({ ...newProvider, id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white"
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
                    className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 font-mono"
                  />
                  
                  <button
                    onClick={addProvider}
                    disabled={!newProvider.apiKey}
                    className="w-full px-4 py-2 text-sm text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
                  >
                    Add Provider
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm text-neutral-400 mb-4">Data</h2>
          <button
            onClick={() => {
              if (confirm('Clear all usage data?')) {
                storage.clearUsage();
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 text-sm text-red-400 bg-red-900/20 rounded-lg hover:bg-red-900/30"
          >
            Clear Usage Data
          </button>
        </section>
      </main>
    </div>
  );
}
