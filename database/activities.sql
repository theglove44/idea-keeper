-- Create activities table for tracking card changes and collaboration events

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  type text not null check (type in (
    'card_created',
    'card_moved',
    'card_updated',
    'comment_added',
    'assignee_added',
    'assignee_removed',
    'due_date_set',
    'due_date_changed',
    'priority_changed',
    'tag_added',
    'tag_removed'
  )),
  "user" text, -- User who performed the action
  metadata jsonb, -- Additional context (old/new values, etc.)
  created_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists activities_card_id_idx on public.activities(card_id);
create index if not exists activities_idea_id_idx on public.activities(idea_id);
create index if not exists activities_created_at_idx on public.activities(created_at desc);

comment on table public.activities is 'Tracks all changes and activities on cards for collaboration and audit trail';
comment on column public.activities.metadata is 'JSONB field containing additional context like old/new values';
