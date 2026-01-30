# Real-Time Kanban Architecture

## Current Architecture (Before Implementation)

```
┌─────────────────┐
│  Browser Tab 1  │
│   (page.tsx)    │
└────────┬────────┘
         │
         │ Manual fetch
         │ (on load + user action)
         ↓
┌─────────────────────────┐
│    API Routes           │
│  /api/tasks (CRUD)      │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│   Supabase DB           │
│   (tasks table)         │
└─────────────────────────┘
         ↑
         │ Manual fetch
         │
┌────────┴────────┐
│  Browser Tab 2  │
│   (page.tsx)    │
└─────────────────┘

❌ Problem: Tabs don't know about each other's changes!
```

## New Architecture (After Implementation)

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Realtime                    │
│              (postgres_changes channel)                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ Broadcasts:
                    │ • INSERT events
                    │ • UPDATE events  
                    │ • DELETE events
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌───────────────┐       ┌───────────────┐
│ Browser Tab 1 │       │ Browser Tab 2 │
│  (page.tsx)   │       │  (page.tsx)   │
│               │       │               │
│ useRealtime-  │       │ useRealtime-  │
│ Tasks hook    │       │ Tasks hook    │
└───────┬───────┘       └───────┬───────┘
        │                       │
        │ Mutate via API        │ Mutate via API
        ↓                       ↓
┌─────────────────────────────────────────┐
│           API Routes                    │
│        /api/tasks (CRUD)                │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│          Supabase DB                    │
│          (tasks table)                  │
│                                         │
│  Change triggers Realtime broadcast ──┐ │
└────────────────────────────────────────┘│
                                          │
                    ┌─────────────────────┘
                    │ Loop back to top
                    └─ Realtime notification
                       sent to all subscribers

✅ Solution: All tabs receive updates automatically!
```

## Data Flow Examples

### Scenario 1: User Creates Task in Tab 1

```
Tab 1                  API                 Supabase             Realtime            Tab 2
  │                     │                     │                     │                 │
  │─ POST /api/tasks ──>│                     │                     │                 │
  │                     │─ INSERT task ──────>│                     │                 │
  │                     │                     │─ Broadcast INSERT ─>│                 │
  │<── 201 Created ─────│                     │                     │                 │
  │                     │                     │                     │─ onTaskCreated ─>│
  │ Update UI           │                     │                     │                 │ Update UI
  │ (optimistic)        │                     │                     │                 │ (realtime)
```

### Scenario 2: User Updates Task in Tab 2

```
Tab 2                  API                 Supabase             Realtime            Tab 1
  │                     │                     │                     │                 │
  │─ PUT /api/tasks ───>│                     │                     │                 │
  │                     │─ UPDATE task ──────>│                     │                 │
  │                     │                     │─ Broadcast UPDATE ─>│                 │
  │<── 200 OK ──────────│                     │                     │                 │
  │                     │                     │                     │─ onTaskUpdated ─>│
  │ Update UI           │                     │                     │                 │ Refetch task
  │ (optimistic)        │                     │                     │                 │ Update UI
```

### Scenario 3: Drag & Drop Status Change

```
Tab 1 (Drag Task: Todo → In Progress)
  │
  │ 1. Optimistic update (instant UI change)
  ├─ setTasks(prev => prev.map(...update status))
  │
  │ 2. Send to API
  ├─ PUT /api/tasks { id: "...", status: "in_progress" }
  │
  │ 3. API writes to DB
  │   Supabase: UPDATE tasks SET status='in_progress' WHERE id='...'
  │
  │ 4. Realtime broadcast (automatic)
  │   Supabase Realtime: Broadcast UPDATE event
  │
  │ 5. Tab 2 receives update
  └─> Tab 2: onTaskUpdated() → Refetch task → Update UI

Result: Tab 1 sees change instantly (optimistic)
        Tab 2 sees change within ~100ms (realtime)
```

## Hook Integration Pattern

### Before (Manual Polling)
```typescript
// page.tsx
useEffect(() => {
  fetchTasks()
  const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
  return () => clearInterval(interval)
}, [])

const fetchTasks = async () => {
  const res = await fetch('/api/tasks')
  const data = await res.json()
  setTasks(data.tasks)
}
```

### After (Realtime Subscriptions)
```typescript
// page.tsx
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks'

// Initial fetch
useEffect(() => {
  fetchTasks()
}, [])

// Realtime updates
useRealtimeTasks({
  onTaskCreated: (task) => {
    setTasks(prev => [transformTask(task), ...prev])
  },
  onTaskUpdated: async (task) => {
    const res = await fetch(`/api/tasks/${task.id}`)
    const fullTask = await res.json()
    setTasks(prev => prev.map(t => t.id === fullTask.id ? fullTask : t))
  },
  onTaskDeleted: (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }
})
```

## Realtime Hook Implementation

### Current Implementation (`use-realtime-tasks.ts`)

```typescript
export function useRealtimeTasks({ onTaskCreated, onTaskUpdated, onTaskDeleted }) {
  useEffect(() => {
    // Create a channel for postgres changes
    const channel = supabase
      .channel('tasks-changes')
      
      // Listen for INSERT events
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task created:', payload.new)
          onTaskCreated?.(payload.new)
          toast({ title: 'Task Created', description: payload.new.title })
        }
      )
      
      // Listen for UPDATE events
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task updated:', payload.new)
          onTaskUpdated?.(payload.new)
        }
      )
      
      // Listen for DELETE events
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task deleted:', payload.old.id)
          onTaskDeleted?.(payload.old.id)
          toast({ title: 'Task Deleted', variant: 'destructive' })
        }
      )
      
      // Subscribe to start receiving events
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted])
}
```

## Database Realtime Requirements

### Supabase Realtime Must Be:

1. **Enabled on the table:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
   ```

2. **Row Level Security (RLS) configured:**
   ```sql
   -- Allow read access (needed for realtime)
   CREATE POLICY "Enable read access for all users" ON tasks
   FOR SELECT USING (true);
   ```

3. **Realtime enabled in Supabase dashboard:**
   - Project Settings → Database → Replication
   - Enable realtime for `tasks` table

## Performance Considerations

### What Gets Sent in Realtime Events

**INSERT event:**
```json
{
  "new": {
    "id": "uuid-here",
    "title": "New task",
    "status": "todo",
    "priority": "medium",
    // ... all task columns
  }
}
```

**UPDATE event:**
```json
{
  "old": { "id": "uuid-here", "status": "todo", ... },
  "new": { "id": "uuid-here", "status": "in_progress", ... }
}
```

**DELETE event:**
```json
{
  "old": { "id": "uuid-here", "title": "Deleted task", ... }
}
```

### NOT Included in Realtime Events:
- ❌ Joined data (labels, comments, dependencies)
- ❌ Computed fields
- ❌ Related table data

**Solution:** Refetch full task data when needed:
```typescript
onTaskUpdated: async (task) => {
  const res = await fetch(`/api/tasks/${task.id}`)
  const fullTask = await res.json() // Includes labels, comments, etc.
  setTasks(prev => prev.map(t => t.id === fullTask.id ? fullTask : t))
}
```

## Scalability

### How Many Subscriptions?

**Per browser tab:**
- 1 channel for tasks changes
- (Future) 1 channel for task_labels changes
- (Future) 1 channel for comments changes

**With 10 open tabs:**
- 10 connections to Supabase Realtime
- Supabase can handle thousands of concurrent connections

### Network Usage

**Typical update:**
- ~500 bytes per task update event
- With 100 tasks updated per day: ~50KB
- Negligible bandwidth usage

**Connection overhead:**
- WebSocket: ~1KB/s idle
- With 10 tabs: ~10KB/s (very low)

## Summary

✅ **Before:** Manual polling, no sync between tabs  
✅ **After:** Real-time WebSocket updates, instant sync  
✅ **Infrastructure:** Already exists, just needs integration  
✅ **Complexity:** Low - mostly wiring up existing hook  
✅ **Performance:** Excellent - WebSocket is very efficient  
✅ **Scalability:** Great - Supabase handles this natively  

**Result:** Modern, real-time collaborative task management! 🚀
