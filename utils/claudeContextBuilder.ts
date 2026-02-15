import { Card, CardComment, Idea } from '../types';
import { ClaudeContext } from '../services/claudeService';

/**
 * Build context for a card-level Claude interaction.
 * Includes the card details, its column, the board state, and recent comments.
 */
export function buildCardContext(
  idea: Idea,
  card: Card,
  columnTitle: string,
  recentComments: CardComment[]
): ClaudeContext {
  // Build boardState as a summary of all columns and their cards
  const boardState = idea.columns
    .map(col =>
      `${col.title}: ${col.cards.length === 0 ? '(empty)' : col.cards.map(c => c.text).join('; ')}`
    )
    .join('\n');

  // Build recentComments as a formatted string (last 10 comments)
  const commentsStr = recentComments
    .slice(-10)
    .map(c => `${c.author || 'User'}: ${c.body}`)
    .join('\n');

  return {
    ideaTitle: idea.title,
    ideaSummary: idea.summary,
    cardText: card.text,
    columnTitle,
    boardState,
    recentComments: commentsStr || undefined,
    mentionType: 'card'
  };
}

/**
 * Build context for a global-level Claude interaction.
 * Includes the selected idea's board state and all ideas summary.
 */
export function buildGlobalContext(
  ideas: Idea[],
  selectedIdea?: Idea
): ClaudeContext {
  // If there's a selected idea, include its full board state
  let boardState = '';
  if (selectedIdea) {
    boardState = selectedIdea.columns
      .map(col =>
        `${col.title}: ${col.cards.length === 0 ? '(empty)' : col.cards.map(c => c.text).join('; ')}`
      )
      .join('\n');
  }

  // Include a summary of all ideas
  const ideasSummary = ideas.map(i => `- ${i.title}: ${i.summary}`).join('\n');
  const ideaSummary = selectedIdea
    ? `${selectedIdea.summary}\n\nAll projects:\n${ideasSummary}`
    : `Projects:\n${ideasSummary}`;

  return {
    ideaTitle: selectedIdea?.title,
    ideaSummary: ideaSummary,
    boardState: boardState || undefined,
    mentionType: 'global'
  };
}
