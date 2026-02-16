type ColumnConfig = {
  id: string;
  title: string;
};

type IdeaRow = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  [key: string]: any;
};

type CardRow = {
  id: string;
  text: string;
  created_at: string;
  idea_id: string;
  column_id: string;
  due_date?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  priority?: string | null;
  assigned_to?: unknown;
  created_by?: string | null;
  tags?: unknown;
};

type CommentCountRow = {
  card_id: string;
};

export const buildCommentCountsMap = (
  commentRows: CommentCountRow[] | null | undefined
): Record<string, number> => {
  if (!commentRows) return {};

  return commentRows.reduce((acc: Record<string, number>, row) => {
    acc[row.card_id] = (acc[row.card_id] || 0) + 1;
    return acc;
  }, {});
};

export const mapIdeasWithCards = (
  ideasData: IdeaRow[],
  cardsData: CardRow[],
  commentCountsMap: Record<string, number>,
  columnsConfig: ColumnConfig[]
) => {
  return ideasData.map((idea) => {
    const ideaCards = cardsData.filter((card) => card.idea_id === idea.id);
    const columns = columnsConfig.map((colConfig) => ({
      ...colConfig,
      cards: ideaCards
        .filter((card) => card.column_id === colConfig.id)
        .map((card) => ({
          id: card.id,
          text: card.text,
          createdAt: card.created_at,
          commentsCount: commentCountsMap[card.id] || 0,
          dueDate: card.due_date ?? undefined,
          estimatedHours: card.estimated_hours ?? undefined,
          actualHours: card.actual_hours ?? undefined,
          priority: card.priority ?? undefined,
          assignedTo: Array.isArray(card.assigned_to) ? card.assigned_to : [],
          createdBy: card.created_by ?? undefined,
          tags: Array.isArray(card.tags) ? card.tags : [],
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));

    return { ...idea, columns, createdAt: idea.created_at };
  });
};
