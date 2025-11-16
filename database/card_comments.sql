-- Ensure required extension for UUID generation exists
create extension if not exists "pgcrypto";

-- Main card comments table backing the card detail chat feature
create table if not exists public.card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  body text not null,
  author text,
  created_at timestamptz not null default now()
);

-- Accelerate lookups when loading comments for a specific card
create index if not exists card_comments_card_id_idx
  on public.card_comments(card_id);

-- Optional helper view for debugging
comment on table public.card_comments is 'Holds threaded comments captured from the Idea Keeper card detail modal.';
