'use client';

import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import type { Budget } from '@/types';

interface BudgetCardProps {
  spent: number;
  budget: Budget;
  daysRemaining: number;
}

export function BudgetCard({ spent, budget, daysRemaining }: BudgetCardProps) {
  const percentage = budget.monthlyLimit > 0 
    ? Math.min((spent / budget.monthlyLimit) * 100, 100) 
    : 0;
  
  const isWarning = percentage >= budget.alertThreshold;
  const isOverBudget = percentage >= 100;
  const projectedSpend = daysRemaining > 0 
    ? (spent / (30 - daysRemaining)) * 30 
    : spent;
  const willExceed = projectedSpend > budget.monthlyLimit;

  return (
    <div className={`card p-5 relative overflow-hidden ${isOverBudget ? 'border-red-500/30' : isWarning ? 'border-amber-500/20' : ''}`}>
      {/* Background gradient for warning states */}
      {isWarning && (
        <div className={`absolute inset-0 ${isOverBudget ? 'bg-red-500/5' : 'bg-amber-500/5'}`} />
      )}
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#a1a1a1]">Monthly Budget</h3>
            {isWarning && (
              <AlertTriangle className={`w-4 h-4 ${isOverBudget ? 'text-red-400' : 'text-amber-400'}`} />
            )}
          </div>
          <span className="text-xs text-[#555]">{daysRemaining} days left</span>
        </div>
        
        {/* Main numbers */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-semibold tracking-tight">
            {formatCurrency(spent)}
          </span>
          <span className="text-[#555] text-sm">
            / {formatCurrency(budget.monthlyLimit)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget 
                ? 'bg-red-500' 
                : isWarning 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Projection */}
        {daysRemaining > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className={`w-3.5 h-3.5 ${willExceed ? 'text-amber-400' : 'text-[#555]'}`} />
            <span className={willExceed ? 'text-amber-400' : 'text-[#666]'}>
              Projected: {formatCurrency(projectedSpend)} by month end
              {willExceed && ' (over budget)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
