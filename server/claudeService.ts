import { spawn } from 'child_process';

/**
 * Response structure from Claude CLI invocation
 */
export interface ClaudeResponse {
  result: string;
  error?: string;
}

/**
 * Health check status for Claude CLI availability
 */
export interface ClaudeHealthStatus {
  available: boolean;
  version?: string;
  error?: string;
}

/**
 * Timeout duration for Claude CLI operations (2 minutes)
 */
const CLI_TIMEOUT_MS = 120_000;

/**
 * Invokes the Claude Code CLI with the provided prompt and optional system prompt.
 *
 * @param prompt - The user prompt to send to Claude
 * @param systemPrompt - Optional system prompt for context/instructions
 * @returns Promise resolving to ClaudeResponse with result or error
 *
 * @example
 * ```ts
 * const response = await invokeClaude("What is 2+2?");
 * console.log(response.result);
 * ```
 */
export async function invokeClaude(
  prompt: string,
  systemPrompt?: string
): Promise<ClaudeResponse> {
  if (!prompt || prompt.trim().length === 0) {
    return {
      result: '',
      error: 'Prompt cannot be empty'
    };
  }

  return new Promise((resolve) => {
    const args = ['-p', prompt, '--output-format', 'json'];

    // Add system prompt if provided
    if (systemPrompt && systemPrompt.trim().length > 0) {
      args.push('--system-prompt', systemPrompt);
    }

    // Create environment without ANTHROPIC_API_KEY to force OAuth/Max subscription auth
    // Also remove CLAUDECODE to allow spawning from within a Claude Code session
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.CLAUDECODE;

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, CLI_TIMEOUT_MS);

    let stdout = '';
    let stderr = '';
    let didTimeout = false;

    try {
      const childProcess = spawn('claude', args, {
        env,
        signal: abortController.signal,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Capture stdout
      childProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capture stderr for error diagnostics
      childProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      childProcess.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timeoutId);

        // Check if aborted due to timeout
        if (didTimeout || signal === 'SIGTERM') {
          resolve({
            result: '',
            error: `Claude CLI timeout after ${CLI_TIMEOUT_MS / 1000} seconds`
          });
          return;
        }

        // Check for non-zero exit code
        if (code !== 0) {
          const errorMessage = stderr.trim() || stdout.trim() || `Claude CLI exited with code ${code}`;

          // Provide helpful error messages for common issues
          if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
            resolve({
              result: '',
              error: 'Authentication failed. Please ensure you are logged in with OAuth or have a valid Claude Max subscription.'
            });
          } else {
            resolve({
              result: '',
              error: `Claude CLI error: ${errorMessage}`
            });
          }
          return;
        }

        // Parse JSON output
        try {
          const trimmedOutput = stdout.trim();
          if (!trimmedOutput) {
            resolve({
              result: '',
              error: 'Claude CLI returned empty output'
            });
            return;
          }

          // Attempt to parse as JSON
          const parsed = JSON.parse(trimmedOutput);

          // Extract result - handle different possible JSON structures
          let result = '';
          if (typeof parsed === 'string') {
            result = parsed;
          } else if (parsed.result) {
            result = parsed.result;
          } else if (parsed.content) {
            result = parsed.content;
          } else if (parsed.response) {
            result = parsed.response;
          } else {
            result = JSON.stringify(parsed);
          }

          resolve({
            result
          });
        } catch (parseError) {
          resolve({
            result: '',
            error: `Failed to parse Claude CLI JSON output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          });
        }
      });

      // Handle spawn errors (e.g., command not found)
      childProcess.on('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(timeoutId);

        if (err.code === 'ENOENT') {
          resolve({
            result: '',
            error: 'Claude CLI not found. Please install it first: https://docs.anthropic.com/en/docs/claude-code'
          });
        } else if (err.name === 'AbortError') {
          didTimeout = true;
          resolve({
            result: '',
            error: `Claude CLI timeout after ${CLI_TIMEOUT_MS / 1000} seconds`
          });
        } else {
          resolve({
            result: '',
            error: `Failed to spawn Claude CLI: ${err.message}`
          });
        }
      });

    } catch (err) {
      clearTimeout(timeoutId);
      resolve({
        result: '',
        error: `Unexpected error invoking Claude CLI: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  });
}

/**
 * Checks if the Claude Code CLI is available and accessible.
 *
 * @returns Promise resolving to ClaudeHealthStatus with availability info
 *
 * @example
 * ```ts
 * const status = await isClaudeAvailable();
 * if (status.available) {
 *   console.log(`Claude CLI ${status.version} is ready`);
 * } else {
 *   console.error(status.error);
 * }
 * ```
 */
export async function isClaudeAvailable(): Promise<ClaudeHealthStatus> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    try {
      const childProcess = spawn('claude', ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Capture version output
      childProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          const version = stdout.trim() || stderr.trim() || 'unknown';
          resolve({
            available: true,
            version
          });
        } else {
          resolve({
            available: false,
            error: `Claude CLI check failed with exit code ${code}`
          });
        }
      });

      // Handle spawn errors
      childProcess.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          resolve({
            available: false,
            error: 'Claude CLI not installed. Install from: https://docs.anthropic.com/en/docs/claude-code'
          });
        } else {
          resolve({
            available: false,
            error: `Claude CLI error: ${err.message}`
          });
        }
      });

    } catch (err) {
      resolve({
        available: false,
        error: `Unexpected error checking Claude CLI: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  });
}
