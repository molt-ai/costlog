import type { UsageRecord, Project } from '@/types';
import { format, subDays } from 'date-fns';

// OpenAI pricing per 1M tokens (approximate, varies by model)
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  'o1-pro': { input: 150, output: 600 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
  'text-embedding-ada-002': { input: 0.1, output: 0 },
  default: { input: 5, output: 15 },
};

// Anthropic pricing per 1M tokens
const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  default: { input: 3, output: 15 },
};

function calculateCost(
  provider: 'openai' | 'anthropic',
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = provider === 'openai' ? OPENAI_PRICING : ANTHROPIC_PRICING;
  const modelKey = Object.keys(pricing).find(k => model.toLowerCase().includes(k.toLowerCase())) || 'default';
  const rates = pricing[modelKey];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return inputCost + outputCost;
}

// Fetch OpenAI projects list
export async function fetchOpenAIProjects(apiKey: string): Promise<Project[]> {
  try {
    const res = await fetch('https://api.openai.com/v1/organization/projects', {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
        color: '#22c55e', // emerald
        provider: 'openai' as const,
      }));
    }
  } catch (e) {
    console.error('Failed to fetch OpenAI projects:', e);
  }
  return [];
}

export async function fetchOpenAIUsage(apiKey: string): Promise<UsageRecord[]> {
  const records: UsageRecord[] = [];
  const startTime = Math.floor(subDays(new Date(), 30).getTime() / 1000);
  
  // First, fetch projects to map IDs to names
  const projects = await fetchOpenAIProjects(apiKey);
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  
  try {
    // Fetch completions usage grouped by model AND project
    const completionsRes = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&group_by=model,project_id`,
      {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (completionsRes.ok) {
      const data = await completionsRes.json();
      
      for (const bucket of data.data || []) {
        const date = format(new Date(bucket.start_time * 1000), 'yyyy-MM-dd');
        
        for (const result of bucket.results || []) {
          const model = result.model || 'unknown';
          const inputTokens = result.input_tokens || 0;
          const outputTokens = result.output_tokens || 0;
          const projectId = result.project_id || 'default';
          const projectName = projectMap.get(projectId) || projectId;
          
          if (inputTokens > 0 || outputTokens > 0) {
            records.push({
              id: `openai-${date}-${model}-${projectId}-completions`,
              provider: 'openai',
              date,
              model,
              inputTokens,
              outputTokens,
              cost: calculateCost('openai', model, inputTokens, outputTokens),
              projectId,
              projectName,
            });
          }
        }
      }
    }
    
    // Fetch embeddings usage
    const embeddingsRes = await fetch(
      `https://api.openai.com/v1/organization/usage/embeddings?start_time=${startTime}&bucket_width=1d&group_by=model,project_id`,
      {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (embeddingsRes.ok) {
      const data = await embeddingsRes.json();
      
      for (const bucket of data.data || []) {
        const date = format(new Date(bucket.start_time * 1000), 'yyyy-MM-dd');
        
        for (const result of bucket.results || []) {
          const model = result.model || 'unknown';
          const inputTokens = result.input_tokens || 0;
          const projectId = result.project_id || 'default';
          const projectName = projectMap.get(projectId) || projectId;
          
          if (inputTokens > 0) {
            records.push({
              id: `openai-${date}-${model}-${projectId}-embeddings`,
              provider: 'openai',
              date,
              model,
              inputTokens,
              outputTokens: 0,
              cost: calculateCost('openai', model, inputTokens, 0),
              projectId,
              projectName,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch OpenAI usage:', e);
  }
  
  return records;
}

export async function fetchAnthropicUsage(apiKey: string): Promise<UsageRecord[]> {
  const records: UsageRecord[] = [];
  
  try {
    // Anthropic Usage API - fetch daily usage
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    const res = await fetch(
      `https://api.anthropic.com/v1/admin/usage?start_date=${startDate}&end_date=${endDate}&group_by=model,workspace`,
      {
        headers: { 
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (res.ok) {
      const data = await res.json();
      
      for (const usage of data.usage || data.data || []) {
        const date = usage.date || format(new Date(), 'yyyy-MM-dd');
        const model = usage.model || 'claude';
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const projectId = usage.workspace_id || usage.workspace || 'default';
        const projectName = usage.workspace_name || projectId;
        
        if (inputTokens > 0 || outputTokens > 0) {
          records.push({
            id: `anthropic-${date}-${model}-${projectId}`,
            provider: 'anthropic',
            date,
            model,
            inputTokens,
            outputTokens,
            cost: calculateCost('anthropic', model, inputTokens, outputTokens),
            projectId,
            projectName,
          });
        }
      }
    } else {
      console.error('Anthropic API error:', res.status, await res.text());
    }
  } catch (e) {
    console.error('Failed to fetch Anthropic usage:', e);
  }
  
  return records;
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
