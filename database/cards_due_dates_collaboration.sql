-- Migration to add due dates, time tracking, and collaboration features to cards

-- Add new columns to cards table
alter table public.cards
  add column if not exists due_date timestamptz,
  add column if not exists estimated_hours numeric(5,2),
  add column if not exists actual_hours numeric(5,2),
  add column if not exists priority text check (priority in ('low', 'medium', 'high', 'critical')),
  add column if not exists assigned_to text[], -- Array of user names/IDs
  add column if not exists created_by text,
  add column if not exists tags text[]; -- Array of tag names

-- Add indexes for common queries
create index if not exists cards_due_date_idx on public.cards(due_date) where due_date is not null;
create index if not exists cards_priority_idx on public.cards(priority) where priority is not null;
create index if not exists cards_assigned_to_idx on public.cards using gin(assigned_to) where assigned_to is not null;
create index if not exists cards_tags_idx on public.cards using gin(tags) where tags is not null;

comment on column public.cards.due_date is 'Target completion date for the card';
comment on column public.cards.estimated_hours is 'Estimated time to complete in hours';
comment on column public.cards.actual_hours is 'Actual time spent in hours';
comment on column public.cards.priority is 'Priority level: low, medium, high, or critical';
comment on column public.cards.assigned_to is 'Array of users assigned to this card';
comment on column public.cards.created_by is 'User who created the card';
comment on column public.cards.tags is 'Array of tags for categorization';
