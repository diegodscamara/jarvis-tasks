# Real-Time Kanban Updates - Implementation Plan

**Task ID:** 4103b2fb-d559-48d1-b96a-c8e82742bf45  
**Created:** 2024-01-30  
**Status:** Planning Complete

## 📊 Current State Analysis

### Existing Infrastructure
✅ **Supabase Realtime Hook EXISTS** - `src/hooks/use-realtime-tasks.ts`
- Already implements `postgres_changes` subscriptions for tasks
- Includes handlers for INSERT, UPDATE, DELETE events
- Has toast notifications built-in
- Also includes `useRealtimeComments` and `useRealtimeNotifications`

❌ **NOT Currently Integrated** - The hook exists but is NOT used in:
- `src/app/page.tsx` (main Kanban board)
- Uses manual `fetchTasks()` with 30s polling for notifications only
- No realtime sync between tabs

### Database Schema
- Tasks table with UUID primary keys ✅
- Supabase Realtime enabled (assumed based on existing hook) ✅
- Related tables: `task_labels`, `comments`, `notifications` ✅

### API Routes
- `src/app/api/tasks/route.ts` handles CRUD operations
- Uses Supabase server client via `@/lib/supabase/queries`
- Already sends Telegram notifications on changes

## 🎯 Implementation Strategy

### Phase 1: Integrate Existing Realtime Hook
**Goal:** Use the already-built `useRealtimeTasks` hook in the main Kanban page

#### Files to Modify:
1. **`src/app/page.tsx`** (PRIMARY CHANGE)
   - Import `useRealtimeTasks` hook
   - Add realtime callbacks to update local state
   - Keep initial `fetchTasks()` for initial load
   - Remove or reduce polling interval (only needed for notifications)

#### Implementation Details:

```typescript
// Add to imports
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks'

// Inside Home component, add:
useRealtimeTasks({
  onTaskCreated: (newTask) => {
    // Add to local state optimistically
    setTasks(prev => [transformTask(newTask), ...prev])
  },
  onTaskUpdated: (updatedTask) => {
    // Update local state
    setTasks(prev => prev.map(t => 
      t.id === updatedTask.id ? transformTask(updatedTask) : t
    ))
  },
  onTaskDeleted: (taskId) => {
    // Remove from local state
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }
})

// Helper function to transform DB format to frontend format
const transformTask = (dbTask) => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  priority: dbTask.priority,
  status: dbTask.status,
  assignee: dbTask.assignee,
  projectId: dbTask.project_id,
  dueDate: dbTask.due_date,
  estimate: dbTask.estimate,
  createdAt: dbTask.created_at,
  updatedAt: dbTask.updated_at,
  // Note: labels and dependencies won't be included in realtime
  // events, will need separate handling
})
```

**Challenges:**
- Realtime events only include the task row, not related data (labels, comments, dependencies)
- Need to decide: refetch full task data on UPDATE or handle partial updates
- Toast notifications might become annoying in multi-user scenarios

### Phase 2: Handle Related Data Updates
**Goal:** Sync `task_labels`, `comments`, and other related data

#### Option A: Refetch on Change (SIMPLER)
When a task update is received, refetch the full task with relations:

```typescript
onTaskUpdated: async (updatedTask) => {
  // Fetch full task data including relations
  const response = await fetch(`/api/tasks/${updatedTask.id}`)
  const fullTask = await response.json()
  setTasks(prev => prev.map(t => t.id === fullTask.id ? fullTask : t))
}
```

**Pros:** Simple, always in sync  
**Cons:** Extra API call per update

#### Option B: Subscribe to Related Tables (OPTIMAL)
Add separate subscriptions for `task_labels`, `comments`:

```typescript
// In use-realtime-tasks.ts, add:
export function useRealtimeTaskLabels(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('task-labels-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_labels' },
        () => onUpdate()
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [onUpdate])
}
```

**Pros:** More granular, efficient  
**Cons:** More complex, multiple subscriptions

**RECOMMENDATION:** Start with Option A (refetch), optimize to Option B if needed

### Phase 3: Improve UX
1. **Optimistic Updates**
   - Update UI immediately when user makes changes
   - Revert if server update fails
   
2. **Toast Notification Improvements**
   - Only show toasts for changes from OTHER users/tabs
   - Add setting to disable realtime toasts
   
3. **Visual Indicators**
   - Add "syncing" indicator
   - Show "updated by [user]" briefly on changed tasks

### Phase 4: Edge Cases & Polish
1. **Conflict Resolution**
   - Handle race conditions (two users editing same task)
   - Last-write-wins is default behavior
   
2. **Performance**
   - Debounce rapid updates
   - Consider virtual scrolling for large task lists
   
3. **Offline Support**
   - Queue updates when offline
   - Sync when connection restored (future enhancement)

## 📋 Specific Files to Modify

### Must Change:
1. **`src/app/page.tsx`** - Add `useRealtimeTasks` integration
2. **`src/hooks/use-realtime-tasks.ts`** - Potentially enhance with options to disable toasts

### Might Change:
3. **`src/components/task-card.tsx`** - Add visual indicators for real-time updates
4. **`src/hooks/use-tasks.ts`** - Could integrate realtime directly into this hook
5. **`src/lib/constants.ts`** - Add realtime settings to DEFAULT_SETTINGS

### Won't Change (Yet):
- API routes (already working correctly)
- Supabase setup (already configured)
- Database schema (no changes needed)

## 🔧 Configuration Checklist

Before implementation, verify:
- [ ] Supabase Realtime is enabled in project settings
- [ ] Database has proper RLS policies for realtime
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- [ ] Test in multiple browser tabs to verify subscriptions work

## 📈 Testing Plan

### Manual Testing:
1. Open app in two browser tabs
2. Create task in Tab 1 → verify appears in Tab 2
3. Update task in Tab 1 → verify updates in Tab 2
4. Delete task in Tab 1 → verify removes from Tab 2
5. Drag task to different column → verify syncs
6. Add label → verify syncs
7. Add comment → verify syncs (if implemented)

### Edge Cases:
- Network disconnect/reconnect
- Rapid successive updates
- Large task lists (100+ tasks)
- Multiple users editing same task

## 🚀 Implementation Steps

### Step 1: Basic Integration (30 min)
1. Modify `src/app/page.tsx`
2. Import and use `useRealtimeTasks`
3. Test basic create/update/delete sync

### Step 2: Related Data (30 min)
1. Implement Option A (refetch on update)
2. Test label and comment sync
3. Verify all fields update correctly

### Step 3: UX Polish (45 min)
1. Add optimistic updates
2. Improve toast logic (only show for external changes)
3. Add syncing indicators

### Step 4: Testing & Bug Fixes (45 min)
1. Multi-tab testing
2. Performance testing
3. Edge case handling

**Total Estimated Time:** 2.5 - 3 hours

## 🎓 Key Learnings

### Supabase Realtime Best Practices:
1. **One channel per subscription scope** - Don't reuse channels
2. **Clean up subscriptions** - Always remove channels in useEffect cleanup
3. **Filter at the database level** - Use `filter` in subscription config
4. **Handle reconnection** - Supabase client handles this automatically
5. **Throttle rapid updates** - Consider debouncing state updates

### React Patterns:
1. **Optimistic UI** - Update immediately, revert on error
2. **Merge state carefully** - Use functional setState for async updates
3. **Avoid re-renders** - Memoize callbacks passed to subscriptions

## 📦 Deliverables

### Code Changes:
- [ ] Modified `src/app/page.tsx` with realtime integration
- [ ] Enhanced `src/hooks/use-realtime-tasks.ts` (if needed)
- [ ] Updated settings/constants for realtime options

### Documentation:
- [x] This implementation plan
- [ ] Code comments explaining realtime flow
- [ ] Update README with realtime features

### Testing:
- [ ] Manual test report
- [ ] Screen recording of multi-tab sync (optional)

## 🚧 Known Limitations

1. **Labels & Dependencies:** Realtime events don't include joined data
   - Solution: Refetch or subscribe to junction tables separately

2. **User Identity:** Current implementation doesn't track which user made changes
   - Solution: Add user_id to updates, check against current user for toast logic

3. **Offline Edits:** No conflict resolution for offline edits
   - Solution: Future enhancement with optimistic queue

4. **Performance:** 1000+ tasks might cause subscription overhead
   - Solution: Implement pagination or virtual scrolling first

## 🎯 Success Criteria

- [x] Plan created and documented
- [ ] User sees task changes in real-time across tabs
- [ ] No page refresh needed for updates
- [ ] Smooth, non-disruptive UX (no excessive toasts)
- [ ] Handles at least 100 tasks without lag
- [ ] Works correctly with existing drag-and-drop
- [ ] No data inconsistencies or race conditions

## 📎 References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Existing code: `src/hooks/use-realtime-tasks.ts`

---

**Next Steps:** Review this plan with team, then proceed with Step 1 implementation.
