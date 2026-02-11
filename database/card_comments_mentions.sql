-- Add mentions support to card comments

alter table public.card_comments
  add column if not exists mentions text[]; -- Array of @mentioned user names/IDs

-- Index for finding comments where a user is mentioned
create index if not exists card_comments_mentions_idx
  on public.card_comments using gin(mentions)
  where mentions is not null;

comment on column public.card_comments.mentions is 'Array of users @mentioned in this comment';
