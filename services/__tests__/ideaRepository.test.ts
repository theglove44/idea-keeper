import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCardCommentRows,
  fetchIdeasRows,
  insertCardRow,
  updateCardFieldsRow,
} from '../ideaRepository';

const mocks = vi.hoisted(() => {
  const orderMock = vi.fn();
  const inMock = vi.fn();
  const singleMock = vi.fn();
  const eqMock = vi.fn();
  const selectMock = vi.fn(() => ({ order: orderMock, in: inMock }));
  const insertSelectMock = vi.fn(() => ({ single: singleMock }));
  const insertMock = vi.fn(() => ({ select: insertSelectMock }));
  const updateMock = vi.fn(() => ({ eq: eqMock }));
  const deleteMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  }));

  return {
    orderMock,
    inMock,
    singleMock,
    eqMock,
    selectMock,
    insertSelectMock,
    insertMock,
    updateMock,
    deleteMock,
    fromMock,
    module: {
      supabase: {
        from: fromMock,
      },
    },
  };
});

vi.mock('../supabaseClient', () => mocks.module);

const {
  orderMock,
  inMock,
  singleMock,
  eqMock,
  selectMock,
  insertSelectMock,
  insertMock,
  updateMock,
  fromMock,
} = mocks;

describe('ideaRepository', () => {
  beforeEach(() => {
    orderMock.mockReset();
    inMock.mockReset();
    singleMock.mockReset();
    eqMock.mockReset();
    selectMock.mockClear();
    insertSelectMock.mockClear();
    insertMock.mockClear();
    updateMock.mockClear();
    fromMock.mockClear();
  });

  it('fetches ideas ordered by created_at descending', async () => {
    orderMock.mockResolvedValueOnce({ data: [{ id: 'idea-1' }], error: null });

    const result = await fetchIdeasRows();

    expect(fromMock).toHaveBeenCalledWith('ideas');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual({ data: [{ id: 'idea-1' }], error: null });
  });

  it('fetches card comment rows by card IDs', async () => {
    inMock.mockResolvedValueOnce({ data: [{ card_id: 'card-1' }], error: null });

    const result = await fetchCardCommentRows(['card-1']);

    expect(fromMock).toHaveBeenCalledWith('card_comments');
    expect(selectMock).toHaveBeenCalledWith('card_id');
    expect(inMock).toHaveBeenCalledWith('card_id', ['card-1']);
    expect(result).toEqual({ data: [{ card_id: 'card-1' }], error: null });
  });

  it('inserts a card row and selects the inserted record', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'card-1' }, error: null });

    const result = await insertCardRow('idea-1', 'todo', 'Card text');

    expect(fromMock).toHaveBeenCalledWith('cards');
    expect(insertMock).toHaveBeenCalledWith({
      text: 'Card text',
      idea_id: 'idea-1',
      column_id: 'todo',
    });
    expect(insertSelectMock).toHaveBeenCalledTimes(1);
    expect(singleMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { id: 'card-1' }, error: null });
  });

  it('updates card fields by card id', async () => {
    eqMock.mockResolvedValueOnce({ error: null });

    const result = await updateCardFieldsRow('card-1', { due_date: null });

    expect(fromMock).toHaveBeenCalledWith('cards');
    expect(updateMock).toHaveBeenCalledWith({ due_date: null });
    expect(eqMock).toHaveBeenCalledWith('id', 'card-1');
    expect(result).toEqual({ error: null });
  });
});
