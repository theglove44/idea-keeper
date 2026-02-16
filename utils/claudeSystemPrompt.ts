export interface ClaudePromptContext {
  ideaTitle?: string;
  ideaSummary?: string;
  cardText?: string;
  columnTitle?: string;
  boardState?: string;
  recentComments?: string;
  mentionType: 'card' | 'global';
}

const ACTION_CONTRACT_TEXT = `
IMPORTANT: You cannot directly modify the board. To create, move, or modify cards, you MUST include a JSON action block in your response. The user will see these as proposals they can approve or dismiss. Without action blocks, nothing will happen on the board.

To propose actions, include this exact format at the end of your response:
\`\`\`actions
[{"type": "create_card", "params": {"text": "Card title or description", "columnId": "todo"}}]
\`\`\`

Available action types:
- create_card: {"text": "...", "columnId": "todo" | "doing" | "done"}
- move_card: {"cardId": "...", "targetColumnId": "todo" | "doing" | "done"}
- modify_card: {"cardId": "...", "text": "new text"}

Always include the action block when the user asks you to create, move, or change cards. Each card needs its own action object in the array.
`.trim();

export const buildClaudeSystemPrompt = (context: ClaudePromptContext): string => {
  const parts: string[] = [
    'You are Claude, an AI assistant integrated into a project management tool called "Idea Keeper".',
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

  parts.push(ACTION_CONTRACT_TEXT);

  return parts.join('\n\n');
};

