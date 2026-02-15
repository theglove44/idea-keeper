export interface ClaudeContext {
  ideaTitle?: string;
  ideaSummary?: string;
  cardText?: string;
  columnTitle?: string;
  boardState?: string;
  recentComments?: string;
  mentionType: 'card' | 'global';
}

export interface ClaudeAction {
  type: 'create_card' | 'move_card' | 'modify_card';
  params: Record<string, any>;
}

export interface ClaudeResponse {
  message: string;
  actions?: ClaudeAction[];
  error?: string;
}

/**
 * Detect if running in Tauri environment
 */
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const parseActionsFromMessage = (message: string): { cleanMessage: string; actions?: ClaudeAction[] } => {
  // Match ```actions\n[...]\n``` blocks in the message
  const actionsRegex = /```actions\n([\s\S]*?)\n```/g;
  const matches = Array.from(message.matchAll(actionsRegex));

  if (matches.length === 0) {
    return { cleanMessage: message };
  }

  let actions: ClaudeAction[] = [];

  try {
    for (const match of matches) {
      const jsonString = match[1];
      const parsed = JSON.parse(jsonString);

      // Handle both single action object and array of actions
      if (Array.isArray(parsed)) {
        actions = actions.concat(parsed);
      } else {
        actions.push(parsed);
      }
    }
  } catch (error) {
    console.warn('Failed to parse Claude action block:', error);
    // Return message as-is if parsing fails
    return { cleanMessage: message };
  }

  // Remove all action blocks from the message
  const cleanMessage = message.replace(actionsRegex, '').trim();

  return { cleanMessage, actions: actions.length > 0 ? actions : undefined };
};

/**
 * Fetch-based implementation for browser/Vite environment.
 * Uses Vite middleware to communicate with Claude CLI.
 */
const fetchSendToClaude = async (prompt: string, context: ClaudeContext): Promise<ClaudeResponse> => {
  try {
    const response = await fetch(`/api/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        message: '',
        error: errorData.error || `API request failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    // Parse actions from the raw message
    const { cleanMessage, actions } = parseActionsFromMessage(data.message || '');

    return {
      message: cleanMessage,
      actions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message to Claude';
    console.error('Claude service error:', error);

    return {
      message: '',
      error: errorMessage,
    };
  }
};

/**
 * Environment-aware sendToClaude router.
 * Automatically uses Tauri shell plugin in desktop app, or Vite middleware in browser.
 */
export const sendToClaude = async (prompt: string, context: ClaudeContext): Promise<ClaudeResponse> => {
  if (isTauri) {
    const { tauriSendToClaude } = await import('./tauriClaudeService');
    return tauriSendToClaude(prompt, context);
  }
  return fetchSendToClaude(prompt, context);
};

/**
 * Fetch-based health check for browser/Vite environment.
 */
const fetchCheckClaudeHealth = async (): Promise<{ available: boolean; version?: string }> => {
  try {
    const response = await fetch(`/api/claude/health`);

    if (!response.ok) {
      return { available: false };
    }

    const data = await response.json();
    return {
      available: true,
      version: data.version,
    };
  } catch (error) {
    console.warn('Claude health check failed:', error);
    return { available: false };
  }
};

/**
 * Environment-aware checkClaudeHealth router.
 * Automatically uses Tauri shell plugin in desktop app, or Vite middleware in browser.
 */
export const checkClaudeHealth = async (): Promise<{ available: boolean; version?: string }> => {
  if (isTauri) {
    const { tauriCheckClaudeHealth } = await import('./tauriClaudeService');
    return tauriCheckClaudeHealth();
  }
  return fetchCheckClaudeHealth();
};
