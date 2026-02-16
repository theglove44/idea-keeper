import { supabase } from './supabaseClient';

export const fetchIdeasRows = () =>
  supabase!
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false });

export const fetchCardsRows = () => supabase!.from('cards').select('*');

export const fetchCardCommentRows = (cardIds: string[]) =>
  supabase!
    .from('card_comments')
    .select('card_id')
    .in('card_id', cardIds);

export const insertIdeaRow = (title: string, summary: string) =>
  supabase!
    .from('ideas')
    .insert({ title, summary })
    .select()
    .single();

export const updateIdeaRow = (id: string, title: string, summary: string) =>
  supabase!
    .from('ideas')
    .update({ title, summary })
    .eq('id', id);

export const deleteIdeaRow = (id: string) =>
  supabase!
    .from('ideas')
    .delete()
    .eq('id', id);

export const insertCardRow = (ideaId: string, columnId: string, text: string) =>
  supabase!
    .from('cards')
    .insert({ text, idea_id: ideaId, column_id: columnId })
    .select()
    .single();

export const insertCardsRows = (
  rows: Array<{ text: string; column_id: string; idea_id: string }>
) => supabase!.from('cards').insert(rows);

export const moveCardRow = (cardId: string, destColumnId: string) =>
  supabase!
    .from('cards')
    .update({ column_id: destColumnId })
    .eq('id', cardId);

export const updateCardTextRow = (cardId: string, text: string) =>
  supabase!
    .from('cards')
    .update({ text })
    .eq('id', cardId);

export const updateCardFieldsRow = (
  cardId: string,
  updates: Record<string, unknown>
) =>
  supabase!
    .from('cards')
    .update(updates)
    .eq('id', cardId);
