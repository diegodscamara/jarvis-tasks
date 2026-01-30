# Task: Implement Docs & Logs Modules

**Status**: In Progress
**Assignee**: Jarvis (Orchestrator)
**Priority**: High
**Spec**: `specs/DOCS_AND_LOGS_FEATURE.md`

## Description
Implement the "Docs Hub" and "Live Agent Logs" features as described in the specification.

## Subtasks
- [ ] **Database Schema**
    - [ ] Create `documents` table (path, content, category)
    - [ ] Create `agent_logs` table (level, type, message, metadata)
    - [ ] Update Drizzle schema & push migrations
- [ ] **Docs Page**
    - [ ] Create `/docs` layout and sidebar
    - [ ] Implement Markdown renderer
    - [ ] Create sync script (`scripts/sync-docs.ts`)
- [ ] **Logs Page**
    - [ ] Create `/logs` page with Timeline component
    - [ ] Connect Supabase Realtime for live updates
- [ ] **Agent Integration**
    - [ ] Update Agent (Clawdbot) to push logs to Supabase
    - [ ] Configure daily sync for docs

## Dispatch Log
- **2026-01-30**: Spec created. Roadmap updated. Task initialized.
