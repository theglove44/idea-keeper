import { supabase, supabaseInitializationError } from './supabaseClient';
import { CardComment } from '../types';

const TABLE = 'card_comments';

const ensureClient = () => {
  if (supabaseInitializationError || !supabase) {
    throw new Error(
      supabaseInitializationError || 'Supabase client is not initialized.'
    );
  }
  return supabase;
};

const mapComment = (row: any): CardComment => ({
  id: row.id,
  cardId: row.card_id,
  body: row.body,
  author: row.author,
  createdAt: row.created_at,
});

const tableMissingMessage =
  'Supabase table "card_comments" is missing. Run the SQL in database/card_comments.sql against your project and refresh the schema.';

const isTableMissingError = (error: any) => {
  if (!error) return false;
  const codeMatch = error.code === '42P01';
  const messageMatch = typeof error.message === 'string' && error.message.includes("'public.card_comments'");
  return codeMatch || messageMatch;
};

export const fetchCardComments = async (cardId: string): Promise<CardComment[]> => {
  const client = ensureClient();
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isTableMissingError(error)) {
      throw new Error(tableMissingMessage);
    }
    throw new Error(error.message || 'Failed to fetch card comments');
  }

  return (data || []).map(mapComment);
};

export const addCardComment = async (
  cardId: string,
  body: string,
  author?: string | null
): Promise<CardComment> => {
  const client = ensureClient();
  const { data, error } = await client
    .from(TABLE)
    .insert({ card_id: cardId, body, author })
    .select()
    .single();

  if (error || !data) {
    if (isTableMissingError(error)) {
      throw new Error(tableMissingMessage);
    }
    throw new Error(error?.message || 'Failed to add card comment');
  }

  return mapComment(data);
};
