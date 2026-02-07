'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { storage } from '@/lib/storage';
import type { Alert } from '@/types';

interface AlertsDropdownProps {
  alerts: Alert[];
  onUpdate: () => void;
}

export function AlertsDropdown({ alerts, onUpdate }: AlertsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const unreadCount = alerts.filter(a => !a.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    alerts.forEach(a => storage.markAlertRead(a.id));
    onUpdate();
  };

  const clearAll = () => {
    storage.clearAlerts();
    onUpdate();
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 card shadow-2xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
            <span className="text-sm font-medium">Alerts</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-[#555] hover:text-white rounded-lg hover:bg-white/[0.05]"
                  title="Mark all read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {alerts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 text-[#555] hover:text-red-400 rounded-lg hover:bg-red-500/10"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-[#555] text-sm">
                No alerts yet
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    storage.markAlertRead(alert.id);
                    onUpdate();
                  }}
                  className={`p-3 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer ${
                    !alert.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-0.5">{alert.title}</p>
                      <p className="text-xs text-[#666] line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-[#444] mt-1">
                        {format(parseISO(alert.date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
