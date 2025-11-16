import { useCallback, useEffect, useState } from 'react';
import { CardComment } from '../types';
import { addCardComment, fetchCardComments } from '../services/commentService';

const generateTempId = () => {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  return `temp-${globalCrypto?.randomUUID ? globalCrypto.randomUUID() : Date.now()}`;
};

export const useCardComments = (cardId: string | null) => {
  const [comments, setComments] = useState<CardComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!cardId) {
      setComments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCardComments(cardId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = useCallback(
    async (body: string, author?: string | null) => {
      if (!cardId) return;
      const trimmedBody = body.trim();
      if (!trimmedBody) return;

      const optimisticComment: CardComment = {
        id: generateTempId(),
        cardId,
        body: trimmedBody,
        author: author ?? 'You',
        createdAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, optimisticComment]);
      setIsSubmitting(true);
      setError(null);

      try {
        const saved = await addCardComment(cardId, trimmedBody, author);
        setComments((prev) =>
          prev.map((comment) => (comment.id === optimisticComment.id ? saved : comment))
        );
      } catch (err) {
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
        setError(err instanceof Error ? err.message : 'Failed to add comment');
      } finally {
        setIsSubmitting(false);
      }
    },
    [cardId]
  );

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    submitComment,
    reloadComments: loadComments,
  };
};

export type UseCardCommentsReturn = ReturnType<typeof useCardComments>;
