import React, { useState } from 'react';
import { Card } from '../types';

type DragInfo = {
  cardId: string;
  sourceColumnId: string;
} | null;

type UseCardDragAndEditParams = {
  ideaId: string | null;
  onMoveCard: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => void;
  onEditCard: (cardId: string, newText: string, ideaId: string) => void;
};

export const useCardDragAndEdit = ({
  ideaId,
  onMoveCard,
  onEditCard,
}: UseCardDragAndEditParams) => {
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardText, setEditingCardText] = useState<string>('');

  const onDragStart = (e: React.DragEvent, card: Card, sourceColumnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDragInfo({ cardId: card.id, sourceColumnId });
  };

  const onDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (columnId !== dragOverColumn) {
      setDragOverColumn(columnId);
    }
  };

  const onDragEnd = () => {
    setDragInfo(null);
    setDragOverColumn(null);
  };

  const onDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault();
    if (!dragInfo || !ideaId) return;

    const { cardId, sourceColumnId } = dragInfo;

    if (sourceColumnId !== destinationColumnId) {
      onMoveCard(cardId, sourceColumnId, destinationColumnId, ideaId);
    }

    setDragInfo(null);
    setDragOverColumn(null);
  };

  const handleStartEditingCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditingCardText(card.text);
  };

  const handleCancelCardEdit = () => {
    setEditingCardId(null);
    setEditingCardText('');
  };

  const handleSaveCardEdit = () => {
    if (!ideaId || !editingCardId) return;

    const trimmedText = editingCardText.trim();
    if (trimmedText === '') {
      handleCancelCardEdit();
      return;
    }

    onEditCard(editingCardId, trimmedText, ideaId);

    setEditingCardId(null);
    setEditingCardText('');
  };

  return {
    dragInfo,
    dragOverColumn,
    setDragOverColumn,
    editingCardId,
    editingCardText,
    setEditingCardText,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    handleStartEditingCard,
    handleSaveCardEdit,
    handleCancelCardEdit,
  };
};

