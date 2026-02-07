import type { UsageRecord } from '@/types';
import { format, subDays } from 'date-fns';

// OpenAI pricing per 1M tokens (approximate, varies by model)
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  default: { input: 5, output: 15 },
};

// Anthropic pricing per 1M tokens
const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  default: { input: 3, output: 15 },
};

function calculateCost(
  provider: 'openai' | 'anthropic',
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = provider === 'openai' ? OPENAI_PRICING : ANTHROPIC_PRICING;
  const modelKey = Object.keys(pricing).find(k => model.includes(k)) || 'default';
  const rates = pricing[modelKey];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return inputCost + outputCost;
}

export async function fetchOpenAIUsage(apiKey: string): Promise<UsageRecord[]> {
  const records: UsageRecord[] = [];
  
  // OpenAI usage API - last 30 days
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    try {
      const res = await fetch(`https://api.openai.com/v1/usage?date=${date}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      
      if (data.data) {
        for (const item of data.data) {
          const model = item.snapshot_id || 'unknown';
          const inputTokens = item.n_context_tokens_total || 0;
          const outputTokens = item.n_generated_tokens_total || 0;
          
          if (inputTokens > 0 || outputTokens > 0) {
            records.push({
              id: `openai-${date}-${model}`,
              provider: 'openai',
              date,
              model,
              inputTokens,
              outputTokens,
              cost: calculateCost('openai', model, inputTokens, outputTokens),
            });
          }
        }
      }
    } catch (e) {
      console.error(`Failed to fetch OpenAI usage for ${date}:`, e);
    }
  }
  
  return records;
}

export async function fetchAnthropicUsage(apiKey: string): Promise<UsageRecord[]> {
  // Note: Anthropic doesn't have a public usage API yet
  // This is a placeholder that would need to be updated when they release one
  // For now, users would need to manually check their dashboard or we'd parse from logs
  
  console.log('Anthropic usage API not yet available');
  return [];
}

export async function syncProvider(
  provider: 'openai' | 'anthropic',
  apiKey: string
): Promise<UsageRecord[]> {
  if (provider === 'openai') {
    return fetchOpenAIUsage(apiKey);
  } else {
    return fetchAnthropicUsage(apiKey);
  }
}
