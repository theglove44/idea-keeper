import { buildClaudeSystemPrompt } from '../claudeSystemPrompt';

describe('buildClaudeSystemPrompt', () => {
  it('builds the expected prompt with full context', () => {
    const prompt = buildClaudeSystemPrompt({
      mentionType: 'card',
      ideaTitle: 'Idea Keeper',
      ideaSummary: 'Track work',
      boardState: 'todo: 2, done: 1',
      cardText: 'Ship settings page',
      columnTitle: 'todo',
      recentComments: 'Looks good',
    });

    expect(prompt).toContain(
      'You are Claude, an AI assistant integrated into a project management tool called "Idea Keeper".'
    );
    expect(prompt).toContain('Current project: Idea Keeper - Track work');
    expect(prompt).toContain('Board state: todo: 2, done: 1');
    expect(prompt).toContain('Current card: Ship settings page (in column: todo)');
    expect(prompt).toContain('Recent comments: Looks good');
    expect(prompt).toContain('To propose actions, include this exact format at the end of your response:');
    expect(prompt).toContain('- create_card: {"text": "...", "columnId": "todo" | "doing" | "done"}');
    expect(prompt).toContain('- move_card: {"cardId": "...", "targetColumnId": "todo" | "doing" | "done"}');
    expect(prompt).toContain('- modify_card: {"cardId": "...", "text": "new text"}');
  });

  it('omits optional context sections when values are missing', () => {
    const prompt = buildClaudeSystemPrompt({
      mentionType: 'global',
    });

    expect(prompt).not.toContain('Current project:');
    expect(prompt).not.toContain('Board state:');
    expect(prompt).not.toContain('Current card:');
    expect(prompt).not.toContain('Recent comments:');
    expect(prompt).toContain('IMPORTANT: You cannot directly modify the board.');
  });
});

