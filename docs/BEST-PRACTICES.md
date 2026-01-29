# Jarvis Tasks - Best Practices

## Table of Contents
- [Component Guidelines](#component-guidelines)
- [Code Quality](#code-quality)
- [Database & Migrations](#database--migrations)
- [Testing](#testing)
- [API Calls & Hooks](#api-calls--hooks)
- [URL State Management](#url-state-management)
- [Architecture](#architecture)
- [Conventions](#conventions)
- [Recurring Tasks](#recurring-tasks)

---

## Component Guidelines

### Always Use shadcn/ui Components

**NEVER** use raw HTML elements when a shadcn component exists:

```tsx
// ❌ BAD - Raw HTML
<button onClick={handleClick} className="px-4 py-2 rounded">
  Click me
</button>

// ✅ GOOD - shadcn Button
import { Button } from '@/components/ui/button'

<Button onClick={handleClick}>
  Click me
</Button>
```

### Available shadcn Components
Always check `src/components/ui/` before creating custom elements:

| Element | Use Instead |
|---------|-------------|
| `<button>` | `<Button>` |
| `<input type="checkbox">` | `<Checkbox>` |
| `<input type="text">` | `<Input>` |
| `<select>` | `<Select>` |
| `<input type="radio">` | `<RadioGroup>` |
| Raw toggle buttons | `<Toggle>` or `<ToggleGroup>` |
| Custom dropdowns | `<DropdownMenu>` or `<Popover>` |
| Modal divs | `<Dialog>` |
| Form labels | `<Label>` |
| Dividers | `<Separator>` |

### Creating Reusable Components

Place in `src/components/` with these rules:

1. **One component per file** (named exports for sub-components are OK)
2. **Props interface first**, then component
3. **Use `'use client'`** only when needed (interactivity, hooks)
4. **Forward refs** for components that wrap native elements

```tsx
// src/components/my-component.tsx
'use client'

import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  variant?: 'default' | 'compact'
  className?: string
  onAction?: () => void
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ title, variant = 'default', className, onAction }, ref) => {
    return (
      <div ref={ref} className={cn('p-4', className)}>
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onAction} size={variant === 'compact' ? 'sm' : 'default'}>
          Action
        </Button>
      </div>
    )
  }
)
MyComponent.displayName = 'MyComponent'
```

---

## Code Quality

### Running Checks

**Always run before committing:**

```bash
pnpm check
```

This runs:
1. `biome check --write src` - Lint + format
2. `tsc --noEmit` - Type checking
3. `next build` - Build verification

### Individual Commands

```bash
pnpm lint        # Lint only
pnpm lint:fix    # Lint and auto-fix
pnpm format      # Format code
pnpm typecheck   # TypeScript checks
```

### Biome Configuration

See `biome.json` for rules. Key settings:
- Indent: 2 spaces
- Quotes: single
- Trailing commas: ES5
- Import organization: auto-sorted

---

## Database & Migrations

### Drizzle Workflow

**NEVER** use `db:push` in production. Always use migrations:

```bash
# 1. Make schema changes in src/db/schema.ts

# 2. Generate migration SQL
pnpm db:generate

# 3. Review generated SQL in drizzle/
cat drizzle/0001_*.sql

# 4. Apply migration
pnpm db:migrate
```

### Schema Changes

```typescript
// src/db/schema.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status', { enum: ['backlog', 'todo', 'in_progress', 'done'] })
    .notNull()
    .default('todo'),
  // Add new columns here, then run db:generate
  newField: text('new_field'),
})
```

### Migration File Structure

```
drizzle/
├── 0000_initial.sql
├── 0001_add_comments.sql
├── meta/
│   ├── 0000_snapshot.json
│   └── _journal.json
```

### Viewing Data

```bash
pnpm db:studio  # Opens Drizzle Studio at localhost:4983
```

---

## Testing

### Unit Tests (Coming Soon)

```bash
# Test runner setup
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

### Test Structure

```
src/
├── components/
│   ├── task-card.tsx
│   └── __tests__/
│       └── task-card.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
```

### Test Guidelines

1. **Test behavior, not implementation**
2. **Mock API calls** with MSW or jest mocks
3. **Use data-testid** sparingly, prefer accessible queries
4. **One assertion per test** when possible

---

## API Calls & Hooks

### Reusable Data Hooks

Create hooks in `src/hooks/` for data fetching:

```typescript
// src/hooks/use-tasks.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Task } from '@/types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (task: Partial<Task>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!res.ok) throw new Error('Failed to create task')
    await fetchTasks()
    return res.json()
  }, [fetchTasks])

  const updateTask = useCallback(async (task: Partial<Task>) => {
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!res.ok) throw new Error('Failed to update task')
    await fetchTasks()
    return res.json()
  }, [fetchTasks])

  const deleteTask = useCallback(async (id: string) => {
    const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete task')
    await fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  }
}
```

### Hook Usage

```tsx
// In component
const { tasks, loading, createTask, updateTask } = useTasks()

if (loading) return <Skeleton />
```

---

## URL State Management

### Using Search Params for Filters

```typescript
// src/hooks/use-url-state.ts
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const getParam = useCallback((key: string) => {
    return searchParams.get(key)
  }, [searchParams])

  return { setParam, getParam, searchParams }
}
```

### URL-based Filters

```tsx
// Filter by project via URL
const { setParam, getParam } = useUrlState()
const activeProject = getParam('project')

<Button onClick={() => setParam('project', project.id)}>
  {project.name}
</Button>

// URL becomes: /?project=abc123
```

---

## Architecture

### Folder Structure

```
jarvis-tasks/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── tasks/route.ts
│   │   │   ├── projects/route.ts
│   │   │   └── labels/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React components
│   │   ├── ui/                # shadcn components (don't modify)
│   │   ├── task-card.tsx      # Feature components
│   │   └── task-form.tsx
│   ├── db/                     # Database layer
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── queries.ts         # Query functions
│   │   └── index.ts           # DB connection
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-tasks.ts
│   │   └── use-url-state.ts
│   ├── lib/                    # Utilities
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── types/                  # TypeScript types
│       └── index.ts
├── drizzle/                    # Migration SQL files
├── data/                       # SQLite database
├── public/                     # Static assets
└── docs/                       # Documentation
```

### API Route Pattern

```typescript
// src/app/api/tasks/route.ts
import { db } from '@/db'
import { tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks)
    return NextResponse.json({ tasks: allTasks })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newTask = await db.insert(tasks).values(body).returning()
    return NextResponse.json({ task: newTask[0] })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
```

---

## Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTasks.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `Task`, `Project` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_SETTINGS` |
| Files | kebab-case | `task-card.tsx` |
| CSS classes | Tailwind utilities | `className="flex items-center"` |

### Import Order (Auto-enforced by Biome)

1. React/Next imports
2. Third-party libraries
3. Aliases (`@/components`, `@/lib`)
4. Relative imports
5. Types

### Commit Messages

Use conventional commits:

```
feat: add task filtering by label
fix: resolve date picker timezone issue
refactor: extract task card into separate component
docs: update README with setup instructions
chore: update dependencies
```

---

## Recurring Tasks

### Weekly Quality Checks

1. **Run full check suite**
   ```bash
   pnpm check
   ```

2. **Review and update dependencies**
   ```bash
   pnpm outdated
   pnpm update
   ```

3. **Check for unused dependencies**
   ```bash
   npx depcheck
   ```

### Monthly Improvements

1. **Audit component usage** - Are we using shadcn consistently?
2. **Review bundle size** - `pnpm build` and check `.next/analyze`
3. **Database cleanup** - Remove orphaned records
4. **Documentation review** - Update docs with new patterns

### Code Quality Automation

Add to CI/CD (GitHub Actions):

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm check
```

### Project Organization

Keep things tidy:

1. **One feature per PR** - Easier to review
2. **Delete dead code** - Don't comment out, delete
3. **Keep components small** - < 200 lines ideally
4. **Extract constants** - No magic strings/numbers in components
5. **Type everything** - No `any` types

---

## Quick Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Run production

# Quality
pnpm check            # Full check suite
pnpm lint:fix         # Fix lint issues
pnpm typecheck        # TS only

# Database
pnpm db:generate      # Create migration
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Visual DB browser

# Add shadcn component
npx shadcn@latest add [component]
```
