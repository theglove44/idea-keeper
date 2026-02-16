import { useEffect, useMemo, useState } from 'react';
import { Card, Idea } from '../types';

type FilteredColumn = Idea['columns'][number] & {
  filteredCards: Card[];
};

export const useIdeaBoardFilters = (idea: Idea | null) => {
  const [targetColumnId, setTargetColumnId] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);

  useEffect(() => {
    if (!idea?.columns?.length) {
      setTargetColumnId('');
      return;
    }
    if (!targetColumnId || !idea.columns.some((column) => column.id === targetColumnId)) {
      setTargetColumnId(idea.columns[0].id);
    }
  }, [idea, targetColumnId]);

  const boardStats = useMemo(() => {
    if (!idea) {
      return { total: 0, done: 0, overdue: 0 };
    }
    const allCards = idea.columns.flatMap((column) => column.cards);
    const doneCards = idea.columns.find((column) => column.id === 'done')?.cards.length || 0;
    const now = Date.now();
    const overdueCards = allCards.filter((card) => {
      if (!card.dueDate) return false;
      const due = new Date(card.dueDate).getTime();
      return Number.isFinite(due) && due < now;
    }).length;
    return { total: allCards.length, done: doneCards, overdue: overdueCards };
  }, [idea]);

  const hasActiveFilters =
    filterQuery.trim().length > 0 || showOverdueOnly || showHighPriorityOnly || showAssignedOnly;

  const filteredColumns = useMemo<FilteredColumn[]>(() => {
    if (!idea) return [];

    const query = filterQuery.trim().toLowerCase();
    const now = Date.now();

    const isCardOverdue = (card: Card) => {
      if (!card.dueDate) return false;
      const due = new Date(card.dueDate).getTime();
      return Number.isFinite(due) && due < now;
    };

    return idea.columns.map((column) => {
      const filteredCards = column.cards.filter((card) => {
        const matchesQuery =
          !query ||
          card.text.toLowerCase().includes(query) ||
          (card.tags || []).some((tag) => tag.toLowerCase().includes(query));
        const matchesOverdue = !showOverdueOnly || isCardOverdue(card);
        const matchesPriority = !showHighPriorityOnly || card.priority === 'high' || card.priority === 'critical';
        const matchesAssigned = !showAssignedOnly || (card.assignedTo?.length || 0) > 0;

        return matchesQuery && matchesOverdue && matchesPriority && matchesAssigned;
      });

      return {
        ...column,
        filteredCards,
      };
    });
  }, [idea, filterQuery, showAssignedOnly, showHighPriorityOnly, showOverdueOnly]);

  const clearFilters = () => {
    setFilterQuery('');
    setShowOverdueOnly(false);
    setShowHighPriorityOnly(false);
    setShowAssignedOnly(false);
  };

  return {
    targetColumnId,
    setTargetColumnId,
    filterQuery,
    setFilterQuery,
    showOverdueOnly,
    setShowOverdueOnly,
    showHighPriorityOnly,
    setShowHighPriorityOnly,
    showAssignedOnly,
    setShowAssignedOnly,
    boardStats,
    hasActiveFilters,
    filteredColumns,
    clearFilters,
  };
};

