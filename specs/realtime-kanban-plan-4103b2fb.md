# Real-Time Kanban Updates – Plan (Task 4103b2fb)

**Task ID:** 4103b2fb-d559-48d1-b96a-c8e82742bf45  
**Problem:** User must refresh the page to see task updates.

---

## 1. Key findings

### Supabase Realtime
- **Configured:** `supabase_realtime` publication includes `tasks` in `001_initial_schema.sql` (`ALTER PUBLICATION supabase_realtime ADD TABLE tasks`).
- **Hook exists:** `src/hooks/use-realtime-tasks.ts` subscribes to `postgres_changes` on `tasks` (INSERT/UPDATE/DELETE), with toasts for create/delete.
- **Not used on Kanban:** `src/app/page.tsx` does not use `useRealtimeTasks`; it only calls `fetchTasks()` on mount and after mutations, and polls `fetchNotifications` every 30s.

### Task fetching
- **Page:** `page.tsx` keeps tasks in `useState`, loads via `fetch('/api/tasks')` in `useEffect`, and refetches after save/delete/bulk actions.
- **API:** `GET /api/tasks` returns tasks in camelCase (with `dependsOn`/`blockedBy`). No `GET /api/tasks/[id]` route.
- **Realtime payload:** Supabase sends the raw `tasks` row (snake_case: `project_id`, `due_date`, `created_at`, `updated_at`). No labels/dependencies in the payload.

---

## 2. Recommended approach

**Phase 1 – Wire existing hook (minimal change)**  
In `src/app/page.tsx`:

1. Import `useRealtimeTasks`.
2. Add a small helper to map DB row → frontend `Task`: snake_case → camelCase (`project_id` → `projectId`, etc.), and set `labelIds`, `dependsOn`, `blockedBy` from the current task in state for UPDATE (or `[]` for INSERT) so the list stays consistent without a new API.
3. Call `useRealtimeTasks` with:
   - **onTaskCreated:** append `transformDbRowToTask(payload.new)` to `tasks` (e.g. with empty `labelIds`/`dependsOn`/`blockedBy`).
   - **onTaskUpdated:** replace the matching task in state with `transformDbRowToTask(payload.new)`, preserving existing `labelIds`/`dependsOn`/`blockedBy` from current task (or refetch all tasks once per update if you prefer simplicity over consistency of relations).
   - **onTaskDeleted:** filter out `payload.old.id` from `tasks`.
4. Keep initial `fetchTasks()` and existing mutation flows; no change to polling except you can leave notification polling as-is or tune later.

**Phase 2 – Optional improvements**
- **Toasts:** Only show realtime toasts for changes that did not originate from the current tab (e.g. track “last mutation id” or skip toast when the change matches the last optimistic update).
- **Full task on UPDATE:** If you want labels/dependencies always correct without refetching the full list, add `GET /api/tasks/[id]` and call it in `onTaskUpdated`, then replace that task in state with the response.

**What not to do**
- Do not add or edit Supabase migrations for realtime; `tasks` is already in the publication.
- Do not change the existing hook’s subscription shape unless you add options (e.g. disable toasts).

---

## 3. Files to touch

| File | Change |
|------|--------|
| `src/app/page.tsx` | Import `useRealtimeTasks`, add `transformDbRowToTask`, call `useRealtimeTasks` with the three handlers above. |
| `src/hooks/use-realtime-tasks.ts` | Optional: add an option to disable toasts (e.g. `silent: boolean`) for Phase 2. |

---

## 4. Verification

- Open two tabs; create/update/delete in one and confirm the other updates without refresh.
- Confirm drag-and-drop and existing save/delete still work and that realtime updates do not overwrite optimistic updates incorrectly (order of operations: optimistic update first, then realtime may overwrite with server state).
