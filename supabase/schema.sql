-- CostLog Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable Row Level Security
alter database postgres set "app.jwt_claims_path" = '$.app_metadata';

-- Teams table
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  owner_id uuid references auth.users(id) on delete cascade
);

-- Team members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

-- API Providers (encrypted keys)
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  provider text check (provider in ('openai', 'anthropic')) not null,
  api_key_encrypted text not null,
  enabled boolean default true,
  created_at timestamptz default now(),
  unique(team_id, provider)
);

-- Usage records
create table if not exists usage_records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  provider text check (provider in ('openai', 'anthropic')) not null,
  date date not null,
  model text not null,
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  cost numeric(10, 6) default 0,
  project_id text,
  project_name text,
  created_at timestamptz default now(),
  unique(team_id, provider, date, model, project_id)
);

-- Budget settings
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade unique,
  monthly_limit numeric(10, 2) default 100,
  alert_threshold integer default 80 check (alert_threshold between 0 and 100),
  alerts_enabled boolean default true,
  updated_at timestamptz default now()
);

-- Alerts
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  type text check (type in ('threshold', 'anomaly', 'limit')) not null,
  title text not null,
  message text not null,
  severity text check (severity in ('info', 'warning', 'critical')) default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_usage_team_date on usage_records(team_id, date);
create index if not exists idx_usage_provider on usage_records(provider);
create index if not exists idx_alerts_team on alerts(team_id, created_at desc);
create index if not exists idx_team_members_user on team_members(user_id);

-- Row Level Security Policies

-- Teams: Users can see teams they're members of
alter table teams enable row level security;
create policy "Users can view their teams" on teams
  for select using (
    id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Users can create teams" on teams
  for insert with check (owner_id = auth.uid());

-- Team members: Can see members of their teams
alter table team_members enable row level security;
create policy "View team members" on team_members
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Admins can add members" on team_members
  for insert with check (
    team_id in (
      select team_id from team_members 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Providers: Team members can view, admins can modify
alter table providers enable row level security;
create policy "View providers" on providers
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Admins can modify providers" on providers
  for all using (
    team_id in (
      select team_id from team_members 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Usage records: Team members can view
alter table usage_records enable row level security;
create policy "View usage" on usage_records
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Insert usage" on usage_records
  for insert with check (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- Budgets: Team members can view, admins can modify
alter table budgets enable row level security;
create policy "View budget" on budgets
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Admins can modify budget" on budgets
  for all using (
    team_id in (
      select team_id from team_members 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Alerts: Team members can view and mark read
alter table alerts enable row level security;
create policy "View alerts" on alerts
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Insert alerts" on alerts
  for insert with check (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Update alerts" on alerts
  for update using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- Function to create a team with owner
create or replace function create_team_with_owner(team_name text)
returns uuid as $$
declare
  new_team_id uuid;
begin
  insert into teams (name, owner_id)
  values (team_name, auth.uid())
  returning id into new_team_id;
  
  insert into team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');
  
  insert into budgets (team_id)
  values (new_team_id);
  
  return new_team_id;
end;
$$ language plpgsql security definer;
