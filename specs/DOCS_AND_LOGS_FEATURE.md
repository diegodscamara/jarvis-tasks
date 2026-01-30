# Feature Specification: Docs & Logs Dashboard

## Overview
This specification covers the addition of two key modules to the Jarvis Task Manager:
1.  **Docs Hub**: A centralized knowledge base for guidelines, agent memories, and automated reports.
2.  **Live Agent Logs**: A real-time timeline of AI agent activities, orchestration events, and sub-agent spin-ups.

## 1. Docs Hub (`/docs`)

### User Story
As a user, I want to view system guidelines, agent memories (`MEMORY.md`), and daily automation reports (AI polls, sync summaries) directly in the dashboard so I can stay aligned with the AI's context and rules.

### Features
*   **Sidebar Navigation**:
    *   **Core**: `AGENTS.md`, `SOUL.md`, `MEMORY.md` (Long-term memory).
    *   **Automations**: Daily AI Polls, Sync Summaries.
    *   **Guidelines**: Orchestration rules, Guardrails.
*   **Markdown Rendering**: Full GFM support with syntax highlighting.
*   **Search**: Full-text search across documentation.

### Technical Implementation
*   **Source**: Files are primarily located in the Agent Workspace (`/root/clawd`).
*   **Sync Mechanism**:
    *   **Option A (Direct Read)**: If permissions allow, Next.js reads directly from `/root/clawd` (unlikely in prod/Vercel).
    *   **Option B (Database Sync - Recommended)**:
        *   New table: `documents` (path (pk), content, last_updated, category).
        *   Agent Cron Job: Periodically reads local MD files and upserts to Supabase `documents` table.
*   **Frontend**:
    *   Layout: `AppShell` with `Navbar` dedicated to Docs.
    *   Component: `MarkdownViewer` using `react-markdown`.

## 2. Live Agent Logs (`/logs`)

### User Story
As a user, I want to see a real-time feed of what Jarvis is doing, including sub-agent delegations and thought processes, so I can trust the orchestration flow.

### Features
*   **Timeline View**: Chronological list of events (newest top).
*   **Event Types**:
    *   `THOUGHT`: Internal reasoning.
    *   `ACTION`: Tool usage (File write, Shell exec).
    *   `ORCHESTRATION`: Spawning sub-agents.
    *   `SYSTEM`: Errors, start/stop.
*   **Filtering**: Filter by Log Level (Info, Warning, Error) or Agent ID.
*   **Real-time**: Auto-refresh or WebSocket updates via Supabase Realtime.

### Technical Implementation
*   **Database Schema**:
    *   Table: `agent_logs`
        *   `id`: uuid
        *   `created_at`: timestamptz
        *   `level`: enum (info, warn, error, debug)
        *   `type`: enum (thought, action, orchestration, system)
        *   `message`: text
        *   `metadata`: jsonb (tool_name, params, agent_id)
*   **Ingestion**:
    *   The Agent (Clawdbot) will insert rows into `agent_logs` during execution steps (e.g., inside the `think` block or before tool calls).

## Implementation Plan

### Phase 1: Database & Backend
1.  Create Supabase migrations for `documents` and `agent_logs`.
2.  Update Drizzle schema (`src/db/schema.ts`).
3.  Create API endpoints (TRPC or Server Actions) to fetch/subscribe.

### Phase 2: Docs Frontend
1.  Create `/docs` page layout.
2.  Implement Markdown rendering.
3.  Build the "Sync Script" for the agent to push local files to DB.

### Phase 3: Logs Frontend
1.  Create `/logs` page.
2.  Implement Timeline component.
3.  Connect Supabase Realtime subscription.
