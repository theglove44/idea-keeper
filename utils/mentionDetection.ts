// Regex pattern for @claude mention (case insensitive, word boundary)
const CLAUDE_MENTION_REGEX = /@claude\b/i;

/**
 * Check if text contains an @claude mention
 * @param text - The text to check for @claude mentions
 * @returns True if the text contains an @claude mention, false otherwise
 * @example
 * containsClaudeMention("@claude what should I do?") // true
 * containsClaudeMention("@Claude check this") // true
 * containsClaudeMention("Here's a claude reference") // false
 */
export function containsClaudeMention(text: string): boolean {
  return CLAUDE_MENTION_REGEX.test(text);
}

/**
 * Extract the prompt text after @claude mention
 * @param text - The text containing an @claude mention
 * @returns The text after @claude with leading/trailing whitespace removed
 * @example
 * extractClaudePrompt("@claude what should I do?") // "what should I do?"
 * extractClaudePrompt("  @claude   help me refactor this") // "help me refactor this"
 */
export function extractClaudePrompt(text: string): string {
  return text.replace(/@claude\s*/i, '').trim();
}

/**
 * Extract all @mentions from text (returns mention names without the @ symbol)
 * @param text - The text to extract mentions from
 * @returns Array of mention names (without @ symbol) found in the text
 * @example
 * extractAllMentions("@alice and @bob, see what @claude thinks") // ["alice", "bob", "claude"]
 * extractAllMentions("no mentions here") // []
 */
export function extractAllMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g) || [];
  return matches.map(m => m.slice(1));
}
