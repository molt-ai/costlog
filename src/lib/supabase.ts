import { createBrowserClient } from '@supabase/ssr';

// Create a singleton Supabase client for the browser
let supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (supabase) return supabase;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase not configured - running in local-only mode');
    return null;
  }
  
  supabase = createBrowserClient(url, key);
  return supabase;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Database types
export interface DbTeam {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export interface DbTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface DbProvider {
  id: string;
  team_id: string;
  provider: 'openai' | 'anthropic';
  api_key_encrypted: string;
  enabled: boolean;
  created_at: string;
}

export interface DbUsageRecord {
  id: string;
  team_id: string;
  provider: 'openai' | 'anthropic';
  date: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  project_id?: string;
  project_name?: string;
  created_at: string;
}

export interface DbBudget {
  id: string;
  team_id: string;
  monthly_limit: number;
  alert_threshold: number;
  alerts_enabled: boolean;
  updated_at: string;
}
