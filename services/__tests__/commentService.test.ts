import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCardComments, addCardComment } from '../commentService';

const mocks = vi.hoisted(() => {
  const orderMock = vi.fn();
  const eqMock = vi.fn(() => ({ order: orderMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));

  const singleMock = vi.fn();
  const insertSelectMock = vi.fn(() => ({ single: singleMock }));
  const insertMock = vi.fn(() => ({ select: insertSelectMock }));

  const fromMock = vi.fn(() => ({
    select: selectMock,
    insert: insertMock,
  }));

  return {
    orderMock,
    eqMock,
    selectMock,
    singleMock,
    insertSelectMock,
    insertMock,
    fromMock,
    module: {
      supabaseInitializationError: null,
      supabase: {
        from: fromMock,
      },
    },
  };
});

vi.mock('../supabaseClient', () => mocks.module);

const {
  orderMock,
  eqMock,
  selectMock,
  singleMock,
  insertSelectMock,
  insertMock,
  fromMock,
} = mocks;

const missingTableError = {
  code: '42P01',
  message: "Could not find the table 'public.card_comments' in the schema cache",
};

beforeEach(() => {
  orderMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  singleMock.mockReset();
  insertSelectMock.mockClear();
  insertMock.mockClear();
  fromMock.mockClear();
});

describe('commentService error handling', () => {
  it('throws helpful message when card_comments table is missing during fetch', async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: missingTableError });

    await expect(fetchCardComments('card-1')).rejects.toThrow(
      'Supabase table "card_comments" is missing'
    );

    expect(fromMock).toHaveBeenCalledWith('card_comments');
  });

  it('throws helpful message when card_comments table is missing during insert', async () => {
    orderMock.mockResolvedValueOnce({ data: [], error: null });
    singleMock.mockResolvedValueOnce({ data: null, error: missingTableError });

    await expect(addCardComment('card-1', 'test')).rejects.toThrow(
      'Supabase table "card_comments" is missing'
    );

    expect(insertMock).toHaveBeenCalled();
  });
});
