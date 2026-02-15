import { useCallback, useState } from 'react';
import { sendToClaude, ClaudeContext, ClaudeResponse, ClaudeAction } from '../services/claudeService';

export const useClaude = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ClaudeResponse | null>(null);
  const [pendingActions, setPendingActions] = useState<ClaudeAction[]>([]);

  const sendMessage = useCallback(
    async (prompt: string, context: ClaudeContext): Promise<ClaudeResponse | null> => {
      setIsThinking(true);
      setError(null);
      try {
        const response = await sendToClaude(prompt, context);
        setLastResponse(response);
        if (response.error) {
          setError(response.error);
        }
        if (response.actions && response.actions.length > 0) {
          setPendingActions(response.actions);
        }
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to reach Claude';
        setError(msg);
        return null;
      } finally {
        setIsThinking(false);
      }
    },
    []
  );

  const removeAction = useCallback((index: number) => {
    setPendingActions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  const reset = useCallback(() => {
    setIsThinking(false);
    setError(null);
    setLastResponse(null);
    setPendingActions([]);
  }, []);

  return {
    isThinking,
    error,
    lastResponse,
    pendingActions,
    sendMessage,
    removeAction,
    clearPendingActions,
    reset,
  };
};

export type UseClaudeReturn = ReturnType<typeof useClaude>;
