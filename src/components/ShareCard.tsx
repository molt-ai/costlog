'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, X, Zap } from 'lucide-react';

interface ShareCardProps {
  stats: {
    total: number;
    month: number;
    week: number;
    today: number;
    byProvider: { openai: number; anthropic: number };
  };
  topModels: { model: string; cost: number }[];
  period?: string;
}

export function ShareCard({ stats, topModels, period = 'This Month' }: ShareCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async (download: boolean) => {
    if (!cardRef.current) return;
    
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
      });
      
      if (download) {
        const link = document.createElement('a');
        link.download = `costlog-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Try native share API
        if (navigator.share && navigator.canShare) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'costlog.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My AI API Costs',
              text: 'Check out my AI spending breakdown from CostLog',
            });
          } else {
            // Fallback to download
            const link = document.createElement('a');
            link.download = 'costlog.png';
            link.href = dataUrl;
            link.click();
          }
        } else {
          // Fallback: copy to clipboard or download
          const link = document.createElement('a');
          link.download = 'costlog.png';
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (e) {
      console.error('Failed to generate image:', e);
    } finally {
      setGenerating(false);
    }
  };

  const formatCost = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    if (n >= 100) return `$${n.toFixed(0)}`;
    return `$${n.toFixed(2)}`;
  };

  const top3Models = topModels.slice(0, 3);
  const totalProviderSpend = stats.byProvider.openai + stats.byProvider.anthropic;
  const openaiPercent = totalProviderSpend > 0 ? (stats.byProvider.openai / totalProviderSpend) * 100 : 50;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-[#666] hover:text-white rounded-lg hover:bg-white/[0.05]"
        title="Share Stats"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#666] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* The shareable card */}
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#0a0a0a' }}
            >
              {/* Card content - designed for sharing */}
              <div className="p-6" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #141414 100%)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white">CostLog</span>
                  </div>
                  <span className="text-xs text-[#666] px-2 py-1 bg-white/[0.05] rounded-full">
                    {period}
                  </span>
                </div>

                {/* Main stat */}
                <div className="text-center mb-6">
                  <p className="text-sm text-[#666] mb-1">AI API Spend</p>
                  <p className="text-5xl font-bold text-white tracking-tight">
                    {formatCost(stats.month)}
                  </p>
                </div>

                {/* Provider split bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-emerald-400">OpenAI {formatCost(stats.byProvider.openai)}</span>
                    <span className="text-amber-400">Anthropic {formatCost(stats.byProvider.anthropic)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.1] overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${openaiPercent}%` }}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width: `${100 - openaiPercent}%` }}
                    />
                  </div>
                </div>

                {/* Top models */}
                {top3Models.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#666] uppercase tracking-wider">Top Models</p>
                    {top3Models.map((m, i) => (
                      <div key={m.model} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#444]">#{i + 1}</span>
                          <span className="text-sm text-white">{m.model}</span>
                        </div>
                        <span className="text-sm text-[#888]">{formatCost(m.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer watermark */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-1.5">
                  <span className="text-xs text-[#444]">Track your AI costs at</span>
                  <span className="text-xs text-blue-400 font-medium">costlog.dev</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => generateImage(true)}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-sm rounded-xl transition-colors border border-white/[0.08]"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Generating...' : 'Download'}
              </button>
              <button
                onClick={() => generateImage(false)}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-orange-500/25"
              >
                <Share2 className="w-4 h-4" />
                {generating ? 'Generating...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
