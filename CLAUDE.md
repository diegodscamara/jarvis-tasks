# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jarvis Task Manager - A Kanban-style task management system serving as the "brain" for Jarvis AI agent. Tasks can be assigned to different AI agents (Jarvis, Gemini, Copilot, Claude) or Diego (human).

## Commands

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm check            # Full validation: biome check + typecheck + build

# Code Quality
pnpm format           # Format with Biome
pnpm lint:fix         # Lint and auto-fix with Biome
pnpm typecheck        # TypeScript check only

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations (uses scripts/migrate.ts)
pnpm db:studio        # Open Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, RSC enabled)
- **Styling**: Tailwind CSS v4 with PostCSS (no tailwind.config.js needed)
- **UI Components**: shadcn/ui "base-mira" style using Base UI primitives (`@base-ui/react`)
- **Database**: SQLite (better-sqlite3) with Drizzle ORM
- **Linting/Formatting**: Biome (single quotes, no semicolons, 2-space indent, 100 char line width)
- **Package Manager**: pnpm

## Architecture

### Path Aliases
- `@/*` → `./src/*`

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST endpoints)
│   │   ├── tasks/         # Task CRUD + /[id]/comments
│   │   ├── projects/      # Project CRUD
│   │   ├── labels/        # Label CRUD
│   │   ├── analytics/     # Dashboard analytics
│   │   └── jarvis/        # AI agent integration endpoint
│   ├── globals.css        # Tailwind + CSS variables + theme
│   └── page.tsx           # Main Kanban board UI
├── components/
│   ├── ui/                # shadcn/ui components (base-mira style)
│   └── *.tsx              # App-specific components
├── db/
│   ├── schema.ts          # Drizzle ORM schema definitions
│   ├── queries.ts         # Raw SQL queries via better-sqlite3
│   └── index.ts           # Database connection
├── types/                 # TypeScript type definitions
├── lib/                   # Utilities (cn, constants)
└── hooks/                 # React hooks
```

### Database

SQLite database stored at `data/jarvis-tasks.db` with WAL mode enabled.

**Tables**: `projects`, `labels`, `tasks`, `task_labels` (junction), `comments`

**Key relationships**:
- Tasks belong to Projects (optional)
- Tasks have Labels via junction table (many-to-many)
- Tasks have Comments (one-to-many)
- Tasks can have parent Tasks (subtasks)

### UI Components

Uses shadcn/ui "base-mira" style which uses **Base UI** (`@base-ui/react`) as the primary primitive library instead of Radix UI. Some components still use Radix where Base UI lacks equivalents (dropdown-menu, context-menu, menubar, navigation-menu).

### API Pattern

All API routes follow REST conventions in `src/app/api/`:
- `GET` - List/fetch resources
- `POST` - Create resources
- `PUT` - Update resources (requires `id` in body)
- `DELETE` - Remove resources (requires `id` as query param or body)

### Type System

Domain types defined in `src/types/index.ts`:
- `Priority`: 'high' | 'medium' | 'low'
- `Status`: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
- `Agent`: 'jarvis' | 'gemini' | 'copilot' | 'claude' | 'diego'

## Code Conventions

- No comments in code - code must be self-documenting
- Never use `any` type - create proper interfaces
- Run `pnpm format` after modifying files
- Run `pnpm check` before committing