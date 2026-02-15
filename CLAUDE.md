# Idea Keeper — Claude Integration Project

## Project Overview
Integrating Claude AI directly into the Idea Keeper app via Claude Code CLI subprocess. Users @mention Claude in card comments and interact via a global chat panel.

## Architecture Decisions
- **Auth:** Claude Code CLI subprocess (`claude -p --output-format json`) using Max subscription OAuth — no API key
- **Backend:** Vite plugin middleware (matches existing `createReportPlugin` pattern in `vite.config.ts`)
- **Frontend:** React hooks + services pattern (matches existing `useCardComments`, `commentService`)
- **Env var:** `ANTHROPIC_API_KEY` is stripped from subprocess env to force OAuth auth

## Key File Paths
- `server/claudeService.ts` — CLI subprocess wrapper
- `server/claudePlugin.ts` — Vite middleware routes
- `services/claudeService.ts` — Frontend API client
- `utils/mentionDetection.ts` — @claude detection
- `utils/claudeContextBuilder.ts` — Prompt assembly from app state
- `hooks/useClaude.ts` — React hook for Claude interactions
- `components/ClaudeAvatar.tsx` — Visual identity for Claude comments
- `components/ClaudeChatPanel.tsx` — Global chat slide-out panel

## Conventions
- Follow existing Vite plugin pattern from `vite.config.ts` (lines 14-55)
- Follow existing comment hook pattern from `hooks/useCardComments.ts`
- Claude comments use `author: 'Claude'` to distinguish from user comments
- Action proposals from Claude require user confirmation before execution
- All new types go in `types.ts`

## Learnings

### Phase 1: Backend
- Must strip `CLAUDECODE` env var (not just `ANTHROPIC_API_KEY`) to allow spawning Claude CLI from within a Claude Code session
- Claude CLI `--output-format json` returns varied JSON structures — handler must check for `result`, `content`, `response` fields
- Signal comparison for abort: use `signal === 'SIGTERM'` not `'ABORT_ERR'` (TypeScript catches this)

### Phase 2: Frontend Service Layer
- Vite apps use relative URLs for same-origin API calls — no `process.env.REACT_APP_*` (that's CRA)
- Action blocks parsed from Claude responses use ```actions fenced blocks with JSON arrays

### Phase 3: Card-Level Integration
- Existing CardDetailModal tests pass without modification because they mock the comment service
- `idea` prop added to CardDetailModal for Claude context — passed as `selectedIdea!` from App.tsx (non-null assertion safe because modal only renders when a card is selected)
- Amber/orange theme used for all Claude UI elements for consistent visual identity

### Phase 4: Global Chat Panel
- Panel uses local state for messages (not persisted to Supabase yet)
- Wrapped in `<Suspense>` + `<AnimatePresence>` for lazy loading + exit animations

### Phase 5: Health Check + Error Handling
- Dynamic import `import('./services/claudeService')` used for health check to avoid loading Claude service eagerly
- `isClaudeAvailable === false` hides the Claude button; `null` (loading) still shows it

### Action Proposals UX
- When Claude proposes multiple actions (e.g. 5 subtask cards), approving/dismissing must operate on **individual** actions — never `clearPendingActions()` after a single approve
- `useClaude` hook exposes `removeAction(index)` for single-action removal and `clearPendingActions()` only for bulk dismiss
- Both `CardDetailModal` and `ClaudeChatPanel` pass the action index to approve/dismiss handlers
- "Approve All" / "Dismiss All" buttons shown in the header only when there are 2+ pending actions
- Counter label "(X remaining)" gives users visibility into how many actions are left to review
