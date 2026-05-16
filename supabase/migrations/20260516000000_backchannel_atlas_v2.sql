create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid null,
  country_id text not null,
  plan_json jsonb not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.saved_plans(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'general',
  phase text not null default '',
  status text not null default 'todo' check (status in ('todo', 'done')),
  order_index integer not null default 0,
  source_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_currency text not null default 'EUR',
  preferred_language text not null default 'fr',
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists saved_plans_user_id_idx on public.saved_plans(user_id);
create index if not exists plan_tasks_user_id_idx on public.plan_tasks(user_id);
create index if not exists plan_tasks_plan_id_idx on public.plan_tasks(plan_id);
create index if not exists user_settings_user_id_idx on public.user_settings(user_id);

alter table public.profiles enable row level security;
alter table public.saved_plans enable row level security;
alter table public.plan_tasks enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete using ((select auth.uid()) = user_id);

drop policy if exists "saved_plans_select_own" on public.saved_plans;
drop policy if exists "saved_plans_insert_own" on public.saved_plans;
drop policy if exists "saved_plans_update_own" on public.saved_plans;
drop policy if exists "saved_plans_delete_own" on public.saved_plans;

create policy "saved_plans_select_own" on public.saved_plans for select using ((select auth.uid()) = user_id);
create policy "saved_plans_insert_own" on public.saved_plans for insert with check ((select auth.uid()) = user_id);
create policy "saved_plans_update_own" on public.saved_plans for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saved_plans_delete_own" on public.saved_plans for delete using ((select auth.uid()) = user_id);

drop policy if exists "plan_tasks_select_own" on public.plan_tasks;
drop policy if exists "plan_tasks_insert_own" on public.plan_tasks;
drop policy if exists "plan_tasks_update_own" on public.plan_tasks;
drop policy if exists "plan_tasks_delete_own" on public.plan_tasks;

create policy "plan_tasks_select_own" on public.plan_tasks
  for select using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_plans
      where saved_plans.id = plan_tasks.plan_id
      and saved_plans.user_id = (select auth.uid())
    )
  );

create policy "plan_tasks_insert_own" on public.plan_tasks
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_plans
      where saved_plans.id = plan_tasks.plan_id
      and saved_plans.user_id = (select auth.uid())
    )
  );

create policy "plan_tasks_update_own" on public.plan_tasks
  for update using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_plans
      where saved_plans.id = plan_tasks.plan_id
      and saved_plans.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_plans
      where saved_plans.id = plan_tasks.plan_id
      and saved_plans.user_id = (select auth.uid())
    )
  );

create policy "plan_tasks_delete_own" on public.plan_tasks
  for delete using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.saved_plans
      where saved_plans.id = plan_tasks.plan_id
      and saved_plans.user_id = (select auth.uid())
    )
  );

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;
drop policy if exists "user_settings_delete_own" on public.user_settings;

create policy "user_settings_select_own" on public.user_settings for select using ((select auth.uid()) = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert with check ((select auth.uid()) = user_id);
create policy "user_settings_update_own" on public.user_settings for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_settings_delete_own" on public.user_settings for delete using ((select auth.uid()) = user_id);
