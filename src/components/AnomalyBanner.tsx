'use client';

import { AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Anomaly } from '@/types';

interface AnomalyBannerProps {
  anomalies: Anomaly[];
  onDismiss: () => void;
}

export function AnomalyBanner({ anomalies, onDismiss }: AnomalyBannerProps) {
  if (anomalies.length === 0) return null;
  
  const latest = anomalies[anomalies.length - 1];
  const dateStr = format(parseISO(latest.date), 'MMM d');

  return (
    <div className="card p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-amber-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-amber-300 mb-0.5">
          Unusual spend detected
        </h4>
        <p className="text-xs text-[#888] leading-relaxed">
          {dateStr}: {formatCurrency(latest.actualSpend)} spent — {latest.percentageIncrease.toFixed(0)}% higher than your {formatCurrency(latest.expectedSpend)} daily average.
        </p>
      </div>
      
      <button 
        onClick={onDismiss}
        className="p-1.5 text-[#555] hover:text-white rounded-lg hover:bg-white/[0.05] flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
