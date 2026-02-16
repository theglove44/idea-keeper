import { buildCommentCountsMap, mapIdeasWithCards } from '../boardMappers';

describe('buildCommentCountsMap', () => {
  it('returns an empty map when rows are missing', () => {
    expect(buildCommentCountsMap(undefined)).toEqual({});
    expect(buildCommentCountsMap(null)).toEqual({});
  });

  it('aggregates comment counts per card', () => {
    const result = buildCommentCountsMap([
      { card_id: 'card-1' },
      { card_id: 'card-1' },
      { card_id: 'card-2' },
    ]);

    expect(result).toEqual({
      'card-1': 2,
      'card-2': 1,
    });
  });
});

describe('mapIdeasWithCards', () => {
  it('maps idea/card rows into board shape with sorted cards and normalized fields', () => {
    const ideasData = [
      {
        id: 'idea-1',
        title: 'Idea',
        summary: 'Summary',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    ];

    const cardsData = [
      {
        id: 'card-older',
        text: 'Older',
        created_at: '2025-01-01T00:00:00.000Z',
        idea_id: 'idea-1',
        column_id: 'todo',
        due_date: null,
        estimated_hours: null,
        actual_hours: null,
        priority: null,
        assigned_to: 'not-an-array',
        created_by: null,
        tags: 'not-an-array',
      },
      {
        id: 'card-newer',
        text: 'Newer',
        created_at: '2025-01-02T00:00:00.000Z',
        idea_id: 'idea-1',
        column_id: 'todo',
        due_date: '2025-01-10T00:00:00.000Z',
        estimated_hours: 4,
        actual_hours: 2,
        priority: 'high',
        assigned_to: ['Sam'],
        created_by: 'Taylor',
        tags: ['frontend'],
      },
      {
        id: 'card-done',
        text: 'Done',
        created_at: '2025-01-03T00:00:00.000Z',
        idea_id: 'idea-1',
        column_id: 'done',
      },
    ];

    const result = mapIdeasWithCards(
      ideasData,
      cardsData,
      { 'card-newer': 3 },
      [
        { id: 'todo', title: 'To Do' },
        { id: 'done', title: 'Done' },
      ]
    );

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(result[0].columns).toHaveLength(2);

    const todoCards = result[0].columns[0].cards;
    expect(todoCards.map((card) => card.id)).toEqual(['card-newer', 'card-older']);
    expect(todoCards[0].commentsCount).toBe(3);
    expect(todoCards[1].commentsCount).toBe(0);
    expect(todoCards[1].assignedTo).toEqual([]);
    expect(todoCards[1].tags).toEqual([]);
    expect(todoCards[1].dueDate).toBeUndefined();
    expect(todoCards[1].createdBy).toBeUndefined();
  });
});
