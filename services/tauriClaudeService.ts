import { Command } from '@tauri-apps/plugin-shell';
import { ClaudeContext, ClaudeResponse, ClaudeAction, parseActionsFromMessage } from './claudeService';

/**
 * Timeout duration for Claude CLI operations (2 minutes)
 */
const CLI_TIMEOUT_MS = 120_000;

/**
 * Builds a contextual system prompt for Claude based on the current state.
 *
 * This mirrors the implementation from server/claudePlugin.ts to ensure
 * consistent prompting across browser and Tauri environments.
 */
const buildSystemPrompt = (context: ClaudeContext): string => {
  const parts: string[] = [
    'You are Claude, an AI assistant integrated into a project management tool called "Idea Keeper".'
  ];

  if (context.ideaTitle) {
    let projectInfo = `Current project: ${context.ideaTitle}`;
    if (context.ideaSummary) {
      projectInfo += ` - ${context.ideaSummary}`;
    }
    parts.push(projectInfo);
  }

  if (context.boardState) {
    parts.push(`Board state: ${context.boardState}`);
  }

  if (context.cardText) {
    let cardInfo = `Current card: ${context.cardText}`;
    if (context.columnTitle) {
      cardInfo += ` (in column: ${context.columnTitle})`;
    }
    parts.push(cardInfo);
  }

  if (context.recentComments) {
    parts.push(`Recent comments: ${context.recentComments}`);
  }

  parts.push(`
You can propose actions by including a JSON block at the end of your response:
\`\`\`actions
[{"type": "create_card", "params": {"text": "...", "columnId": "todo"}}, ...]
\`\`\`
Available action types: create_card, move_card, modify_card
  `.trim());

  return parts.join('\n\n');
};

/**
 * Invokes Claude CLI directly via Tauri's shell plugin.
 *
 * This bypasses the Vite middleware and spawns the `claude` CLI process
 * directly from the Tauri desktop application.
 *
 * @param prompt - The user's message/question to Claude
 * @param context - Contextual information about the current project state
 * @returns Promise resolving to ClaudeResponse with message, actions, and optional error
 *
 * @example
 * ```ts
 * const response = await tauriSendToClaude("Create a card for testing", {
 *   ideaTitle: "My Project",
 *   mentionType: "global"
 * });
 * console.log(response.message);
 * if (response.actions) {
 *   // Handle proposed actions
 * }
 * ```
 */
export const tauriSendToClaude = async (
  prompt: string,
  context: ClaudeContext
): Promise<ClaudeResponse> => {
  if (!prompt || prompt.trim().length === 0) {
    return {
      message: '',
      error: 'Prompt cannot be empty'
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(context);

    // Build CLI arguments
    const args = ['-p', prompt, '--output-format', 'json'];

    if (systemPrompt && systemPrompt.trim().length > 0) {
      args.push('--system-prompt', systemPrompt);
    }

    // Create command with environment overrides to force OAuth/Max auth
    // Remove ANTHROPIC_API_KEY and CLAUDECODE to allow spawning from Claude Code
    const command = Command.create('claude', args, {
      env: {
        ANTHROPIC_API_KEY: '',
        CLAUDECODE: ''
      }
    });

    // Execute with timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Claude CLI timeout after ${CLI_TIMEOUT_MS / 1000} seconds`));
      }, CLI_TIMEOUT_MS);
    });

    const executePromise = command.execute();

    const result = await Promise.race([executePromise, timeoutPromise]);

    // Check for non-zero exit code
    if (result.code !== 0) {
      const errorMessage = result.stderr.trim() || result.stdout.trim() || `Claude CLI exited with code ${result.code}`;

      // Provide helpful error messages for common issues
      if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        return {
          message: '',
          error: 'Authentication failed. Please ensure you are logged in with OAuth or have a valid Claude Max subscription.'
        };
      }

      return {
        message: '',
        error: `Claude CLI error: ${errorMessage}`
      };
    }

    // Parse JSON output
    const trimmedOutput = result.stdout.trim();
    if (!trimmedOutput) {
      return {
        message: '',
        error: 'Claude CLI returned empty output'
      };
    }

    let rawMessage = '';

    try {
      // Attempt to parse as JSON
      const parsed = JSON.parse(trimmedOutput);

      // Extract result - handle different possible JSON structures
      if (typeof parsed === 'string') {
        rawMessage = parsed;
      } else if (parsed.result) {
        rawMessage = parsed.result;
      } else if (parsed.content) {
        rawMessage = parsed.content;
      } else if (parsed.response) {
        rawMessage = parsed.response;
      } else {
        rawMessage = JSON.stringify(parsed);
      }
    } catch (parseError) {
      return {
        message: '',
        error: `Failed to parse Claude CLI JSON output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      };
    }

    // Parse actions from the raw message
    const { cleanMessage, actions } = parseActionsFromMessage(rawMessage);

    return {
      message: cleanMessage,
      actions
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to invoke Claude CLI';
    console.error('Tauri Claude service error:', error);

    return {
      message: '',
      error: errorMessage
    };
  }
};

/**
 * Checks if the Claude Code CLI is available and accessible in the Tauri environment.
 *
 * @returns Promise resolving to availability status and version info
 *
 * @example
 * ```ts
 * const status = await tauriCheckClaudeHealth();
 * if (status.available) {
 *   console.log(`Claude CLI ${status.version} is ready`);
 * } else {
 *   console.warn('Claude CLI not available');
 * }
 * ```
 */
export const tauriCheckClaudeHealth = async (): Promise<{ available: boolean; version?: string }> => {
  try {
    const command = Command.create('claude', ['--version']);
    const result = await command.execute();

    if (result.code === 0) {
      const version = result.stdout.trim() || result.stderr.trim() || 'unknown';
      return {
        available: true,
        version
      };
    }

    return {
      available: false
    };
  } catch (error) {
    console.warn('Claude health check failed:', error);
    return {
      available: false
    };
  }
};
