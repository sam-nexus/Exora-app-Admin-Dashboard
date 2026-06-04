-- Create unlock_requests table for tracking course unlock requests
create extension if not exists "pgcrypto";

create table if not exists public.unlock_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  reason text,
  status varchar(50) not null default 'pending', -- pending, approved, rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  admin_id uuid references public.profiles(id) on delete set null
);

-- Create indexes for efficient queries
create index if not exists idx_unlock_requests_user_id
  on public.unlock_requests (user_id);

create index if not exists idx_unlock_requests_course_id
  on public.unlock_requests (course_id);

create index if not exists idx_unlock_requests_status
  on public.unlock_requests (status, created_at desc);

create index if not exists idx_unlock_requests_user_status
  on public.unlock_requests (user_id, status);

-- Add RLS policies
alter table public.unlock_requests enable row level security;

-- Students can see their own requests
create policy select_own_requests on public.unlock_requests
  for select
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Admins can update requests (approve/reject)
create policy update_requests_admin on public.unlock_requests
  for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Authenticated users can insert requests
create policy insert_requests on public.unlock_requests
  for insert
  with check (auth.uid() = user_id);
