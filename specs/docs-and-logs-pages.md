# Feature Spec: Docs Page + Logs Page (Jarvis Task Manager)

## Goals

1. **Docs Page**: A first-class place inside Jarvis Task Manager to store and browse important docs:
   - Orchestration guardrails ("no PR until pnpm check", etc.)
   - Multi-agent playbooks / SOPs
   - Memory system overview (daily notes, long-term memory)
   - Daily sync summaries / overnight automation reports
   - Any other team docs that should be easy to find

2. **Logs Page**: A real-time-ish activity timeline of what Jarvis + sub-agents are doing:
   - Dispatch events (who/what/when)
   - Progress updates
   - Errors
   - Completion events
   - Links to relevant PRs / tasks / deployments

## Non-goals (for v1)
- Full collaborative editing (Google-Docs style)
- Full RBAC / multi-user permissions (can be added later)
- Perfect real-time guarantees (polling is fine initially)

---

## Product UX

### Navigation
Add two new top-level entries in the sidebar:
- **Docs**
- **Logs**

### Docs Page UX (v1)
- Left sidebar: **Doc list** grouped by category
- Main panel: **Doc viewer** (markdown rendering)
- Top actions:
  - Search docs
  - Create doc
  - Edit doc
  - Delete doc

Doc categories (starter set):
- Orchestration
- Guardrails
- Memory System
- Daily Summaries
- Runbooks

Doc format:
- Markdown (`contentMarkdown`)

### Logs Page UX (v1)
- Timeline list (newest first)
- Filters:
  - severity: info/warn/error
  - source: jarvis/claude/gemini/codex/cursor/copilot
  - taskId (optional)
  - PR number (optional)
- Each entry shows:
  - timestamp
  - source + kind (dispatch/progress/error/done)
  - message
  - optional metadata chips (task id, PR link, deployment link)

Real-time approach (v1):
- Poll every 2–5s when page is focused
- Pause when tab hidden

---

## Data Model

### Docs
Table: `docs`
- `id` (uuid)
- `title` (text)
- `category` (text)
- `slug` (text, unique)
- `content_markdown` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Logs
Table: `agent_logs`
- `id` (uuid)
- `ts` (timestamptz)
- `source` (text) — jarvis/claude/gemini/codex/cursor/copilot
- `level` (text) — info/warn/error
- `kind` (text) — dispatch/progress/result/error
- `message` (text)
- `task_id` (text, nullable)
- `pr_url` (text, nullable)
- `deployment_url` (text, nullable)
- `meta` (jsonb, nullable)

Indexes:
- `agent_logs(ts desc)`
- `agent_logs(task_id)`
- `docs(slug)`

---

## API (Next.js routes)

### Docs
- `GET /api/docs` → list docs (filter by category/query)
- `POST /api/docs` → create doc
- `GET /api/docs/[slug]` → fetch single doc
- `PATCH /api/docs/[slug]` → update
- `DELETE /api/docs/[slug]` → delete

### Logs
- `GET /api/logs` → list logs (filters + pagination)
- `POST /api/logs` → append log entry (internal use)

---

## Integration with Orchestration

When Jarvis orchestrates work, it should write log entries such as:
- `dispatch`: “Spawned sub-agent cursor-fix-pr4”
- `progress`: “Vercel build pending …”
- `result`: “PR #4 Vercel SUCCESS”
- `error`: “supabase db push failed: …”

This can be done in the existing orchestrator route (`/api/orchestrate`) or in the jarvis-tasks backend where task dispatch is performed.

---

## Implementation Plan (high level)

### Phase 1 — UI + local storage (fast)
- Add routes/pages: `/docs` and `/logs`
- Store docs/logs in the existing persistence layer (for now):
  - If Supabase is enabled: use Supabase
  - Else: fallback to JSON file store (like existing tasks.json)

### Phase 2 — Supabase-first (preferred)
- Add tables + RLS
- Migrate local docs/logs to Supabase
- Enable realtime updates for logs via Supabase subscriptions

---

## Acceptance Criteria

Docs:
- Create/edit/delete docs in app
- Render markdown correctly
- Search by title/content

Logs:
- Logs page shows new events within a few seconds
- Filters work
- Log events can be written from server routes

---

## Open Questions

1. Do we want docs editable by Jarvis only, or editable by Diego in the UI too (v1 assumes yes)?
2. Do we want logs persisted forever or TTL (e.g., keep 30 days)?
3. Should docs support attachments/links (v2)?
