-- Create a single notifications table for Supabase
create extension if not exists "pgcrypto";

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_created_at
  on public.notifications (recipient_id, created_at desc);

create index if not exists idx_notifications_recipient_is_read
  on public.notifications (recipient_id, is_read);

-- Optional Row Level Security policies for secure access
alter table public.notifications enable row level security;

create policy select_own_notifications on public.notifications
  for select
  using (recipient_id = auth.uid());

create policy update_own_notifications on public.notifications
  for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy insert_admin_notifications on public.notifications
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  using (true);
