# Idea Keeper — Claude Integration & Desktop App

## Project Overview
Idea Keeper with integrated Claude AI assistant. Users @mention Claude in card comments and interact via a global chat panel. Runs as a native macOS desktop app via Tauri, or in the browser via Vite dev server. Data persists in Supabase regardless of runtime.

## Architecture Decisions
- **Auth:** Claude Code CLI subprocess (`claude -p --output-format json`) using Max subscription OAuth — no API key needed
- **Desktop app:** Tauri v2 (12MB .app) — Claude CLI spawned via Tauri Shell Plugin
- **Browser dev:** Vite plugin middleware (matches existing `createReportPlugin` pattern)
- **Environment routing:** `services/claudeService.ts` auto-detects Tauri vs browser and routes to the correct backend
- **Frontend:** React hooks + services pattern (matches existing `useCardComments`, `commentService`)
- **Env vars:** `ANTHROPIC_API_KEY` and `CLAUDECODE` stripped from subprocess env to force OAuth auth

## Running the App
- **Desktop app:** `npm run tauri:dev` (dev with hot reload) or open `src-tauri/target/release/bundle/macos/Idea Keeper.app`
- **Browser:** `npm run dev` → `http://localhost:3000`
- **Build desktop:** `npm run tauri:build` → produces `.app` and `.dmg` in `src-tauri/target/release/bundle/`

## Key File Paths

### Claude Integration
- `server/claudeService.ts` — Node.js CLI subprocess wrapper (Vite middleware)
- `server/claudePlugin.ts` — Vite middleware routes (`/api/claude/chat`, `/api/claude/health`)
- `services/claudeService.ts` — Frontend API client with environment routing (Tauri vs browser)
- `services/tauriClaudeService.ts` — Tauri Shell Plugin implementation (spawns CLI directly)
- `utils/mentionDetection.ts` — @claude detection
- `utils/claudeContextBuilder.ts` — Prompt assembly from app state
- `hooks/useClaude.ts` — React hook for Claude interactions
- `components/ClaudeAvatar.tsx` — Visual identity for Claude comments
- `components/ClaudeChatPanel.tsx` — Global chat slide-out panel

### Tauri Desktop
- `src-tauri/tauri.conf.json` — App config (window size, identifier, shell open)
- `src-tauri/src/lib.rs` — Rust entry point with plugin registration (shell, fs, log)
- `src-tauri/capabilities/default.json` — Permissions with scoped shell commands (claude CLI allowed here)
- `src-tauri/Cargo.toml` — Rust dependencies

## Conventions
- Follow existing Vite plugin pattern from `vite.config.ts` (lines 14-55)
- Follow existing comment hook pattern from `hooks/useCardComments.ts`
- Claude comments use `author: 'Claude'` to distinguish from user comments
- Action proposals from Claude require user confirmation before execution
- All new types go in `types.ts`
- Amber/orange theme for all Claude UI elements
- Environment detection: `const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window`

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

### Tauri Desktop App
- **Shell scope goes in capabilities, NOT tauri.conf.json.** In Tauri v2, `plugins.shell` in `tauri.conf.json` only accepts `{ "open": true }`. Putting a `scope` array there causes a runtime crash: `"unknown field 'scope', expected 'open'"`. The scoped command must be defined inline in `src-tauri/capabilities/default.json` using the `allow` array on `shell:allow-execute` and `shell:allow-spawn` permissions (see that file for the exact format)
- The app will briefly appear in the dock and immediately vanish with no visible error if `tauri.conf.json` has invalid plugin config — always test by running the binary directly from terminal (`Idea Keeper.app/Contents/MacOS/app`) to see the actual panic message
- Vite middleware does NOT work in production Tauri builds (only during `tauri dev`) — the Shell Plugin is the production path
- Environment detection via `'__TAURI_INTERNALS__' in window` with dynamic `import()` keeps Tauri plugin code out of the browser bundle
- `Command.create('claude', args, { env: { ANTHROPIC_API_KEY: '', CLAUDECODE: '' } })` strips env vars in Tauri (empty string, not delete)
- Production `.app` is ~12MB (vs ~150MB for Electron) — uses system WebView
- `src-tauri/target/` and `src-tauri/gen/` are gitignored (build artifacts)
- No code signing needed for local use — ad-hoc signature works on Apple Silicon
- `cargo check` from `src-tauri/` is the fastest way to verify Rust compilation without a full build
- First `tauri build` takes ~2 min (compiling all Rust deps); subsequent builds are much faster
