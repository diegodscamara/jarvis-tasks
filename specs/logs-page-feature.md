# Logs Page Feature Specification

## Overview
A real-time, chronological timeline tracking all actions performed by Jarvis, including sub-agent dispatches, task completions, and system events.

## User Story
As Diego, I want to see a real-time timeline of what Jarvis is doing so that I can track progress, understand system behavior, and review completed work chronologically.

## Features

### 1. Logs Timeline Page (`/logs`)
- **Real-time Updates**: Live feed of actions as they happen
- **Timeline View**: Visual timeline with chronological entries
- **Log Types**:
  - **Agent Actions**: Commands run, tools used, decisions made
  - **Sub-Agent Dispatch**: When Jarvis spins up sub-agents (with links to their sessions)
  - **Task Events**: Task creation, updates, completions
  - **System Events**: Cron jobs, heartbeat checks, automated workflows
  - **Messages**: External messages sent/received (Slack, Discord, etc.)
  - **Errors**: Errors and warnings with context
  - **Successes**: Completed actions, successful operations

### 2. Log Entry Detail
- **Timestamp**: Precise time of event
- **Type**: Action, Dispatch, Task, System, Message, Error, Success
- **Actor**: Who performed the action (Jarvis, sub-agent, cron, etc.)
- **Description**: Human-readable description
- **Context**: JSON object with relevant details
- **Session Link**: Link to agent session if applicable
- **Duration**: Time taken for the action (when applicable)
- **Related Items**: Links to tasks, docs, or other entities

### 3. Filtering and Search
- **Filter by Type**: Show only specific log types
- **Filter by Actor**: Show only specific agents/users
- **Filter by Time Range**: Custom date ranges
- **Search**: Full-text search across log descriptions
- **Quick Filters**: "Today", "Last Hour", "Errors Only", "Dispatches Only"

### 4. Real-time Features
- **Live Updates**: WebSocket connection for real-time log streaming
- **Auto-scroll**: Option to auto-scroll to latest logs
- **Pause/Resume**: Pause live updates while reviewing
- **Notifications**: Alert on errors or important events

### 5. Log Actions
- **View Details**: Expand log entry to see full context
- **Copy to Clipboard**: Copy log entry or JSON
- **Export**: Export logs as CSV, JSON, or Markdown
- **Share**: Generate shareable link to log entry
- **Create Issue**: Create a task from a log entry (for errors/issues)

### 6. Analytics Dashboard
- **Activity Chart**: Visual representation of activity over time
- **Agent Activity**: Which agents are most active
- **Error Rate**: Error frequency and trends
- **Performance Metrics**: Average duration of actions
- **Dispatch Summary**: Sub-agent dispatches and their outcomes

### 7. Log Categories

#### Agent Actions
- Commands executed via exec/terminal
- Tool calls (browser, web_search, etc.)
- File operations (read, write, edit)
- API requests

#### Sub-Agent Dispatches
- When sessions_spawn is called
- Agent type and model used
- Task description
- Session status updates (pending, active, completed)
- Results summary

#### Task Events
- Task creation
- Task status changes
- Task completion
- Task dependencies resolved

#### System Events
- Cron job executions
- Heartbeat checks
- Email monitoring
- Memory maintenance
- Security audits

#### Messages
- Messages sent via channels
- Replies received
- Notifications delivered

#### Errors
- Failed operations
- Exceptions caught
- Warnings logged

#### Successes
- Completed workflows
- Successful deployments
- Tests passed
- Bugs fixed

## Database Schema

```sql
-- Logs Table
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'agent_action', 'dispatch', 'task_event', 'system_event', 'message', 'error', 'success'
  actor TEXT NOT NULL, -- 'jarvis', 'sub-agent', 'cron', 'user'
  title TEXT NOT NULL,
  description TEXT,
  context JSONB DEFAULT '{}',
  session_id TEXT, -- link to agent session
  duration_ms INTEGER, -- action duration in milliseconds
  status TEXT DEFAULT 'completed', -- 'pending', 'in_progress', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  related_type TEXT, -- 'task', 'doc', 'log', etc.
  related_id UUID, -- ID of related entity
  tags TEXT[] DEFAULT '{}'
);

-- Log Indexes for Performance
CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_actor ON logs(actor);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_status ON logs(status);
CREATE INDEX idx_logs_session ON logs(session_id);
CREATE INDEX idx_logs_related ON logs(related_type, related_id);
CREATE GIN INDEX idx_logs_context ON logs USING gin(context);
CREATE GIN INDEX idx_logs_tags ON logs USING gin(tags);

-- Log Sessions (for tracking multi-step operations)
CREATE TABLE log_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'dispatch', 'workflow', 'automation'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  parent_session_id UUID REFERENCES log_sessions(id)
);
```

## API Endpoints

```
GET    /api/logs                  - List logs (with filters, pagination)
GET    /api/logs/stream           - Server-Sent Events for real-time logs
GET    /api/logs/:id              - Get single log entry
POST   /api/logs                  - Create log entry (internal use)
GET    /api/logs/analytics        - Get log analytics
GET    /api/logs/export           - Export logs (CSV, JSON, MD)
GET    /api/log-sessions          - List log sessions
GET    /api/log-sessions/:id      - Get session details
```

## UI Components

### `/logs` Page
- **Header**: Title, filters, search, export button
- **Timeline**: Vertical timeline with log entries
- **Log Entry Card**: 
  - Timestamp
  - Type badge (color-coded)
  - Actor avatar/icon
  - Title and description
  - Expand button for details
  - Session link (if applicable)
- **Live Indicator**: Shows "Live" when receiving real-time updates
- **Auto-scroll Toggle**: Control auto-scroll behavior
- **Load More**: Pagination for historical logs

### `/logs/analytics` Page
- **Activity Chart**: Line chart showing activity over time
- **Type Distribution**: Pie/bar chart of log types
- **Agent Activity**: Bar chart of most active agents
- **Error Rate**: Line chart showing error trends
- **Performance**: Bar chart of average action durations

### `/logs/[id]` Page
- **Detail View**: Full log entry with all context
- **Related Logs**: Show logs from same session or related entities
- **Actions**: Copy, share, create task
- **JSON View**: Raw JSON context

## Integration Points

### With sessions_spawn
- When `sessions_spawn` is called, create a "dispatch" log entry
- Update log entry when session status changes
- Link session_id to log entry

### With sessions_list/sessions_history
- Fetch sub-agent session details
- Display in timeline with session status

### With task management
- Log task creation, updates, completions
- Link related tasks to log entries

### With cron
- Log cron job executions
- Show automated workflows in timeline

### With message tool
- Log sent messages
- Track communication patterns

## Initial Seed Data

For testing and demonstration:
- Sample agent actions
- Sample dispatch logs
- Sample system events
- Sample error logs

## Implementation Priority

1. **Phase 1**: Core logging infrastructure
   - Database schema
   - API endpoints
   - Basic timeline view
   - Log creation helpers

2. **Phase 2**: Real-time updates
   - WebSocket/SSE streaming
   - Live updates in UI
   - Auto-scroll and pause controls

3. **Phase 3**: Filtering and analytics
   - Advanced filters
   - Search functionality
   - Analytics dashboard
   - Charts and visualizations

4. **Phase 4**: Integration
   - Auto-logging from Jarvis actions
   - sessions_spawn integration
   - Task event logging
   - Cron job logging

5. **Phase 5**: Advanced features
   - Log sessions tracking
   - Export options
   - Share functionality
   - Create task from log

## Middleware/Helpers

### Log Helper Function

```typescript
// src/lib/logger.ts
export async function logAction(options: {
  type: LogType
  actor: string
  title: string
  description?: string
  context?: Record<string, any>
  sessionId?: string
  durationMs?: number
  relatedType?: string
  relatedId?: string
  tags?: string[]
}) {
  // Create log entry in database
  // Also push to real-time stream
}
```

### Auto-Logging Wrappers

```typescript
// Wrap common operations for auto-logging
export async function withLog<T>(
  options: LogOptions,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  await logAction({ ...options, status: 'in_progress' })
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    await logAction({ ...options, status: 'completed', durationMs: duration })
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    await logAction({ 
      ...options, 
      status: 'failed', 
      durationMs: duration,
      context: { error: error.message }
    })
    throw error
  }
}
```

## Success Criteria
- [ ] Real-time logs stream without lag
- [ ] Can filter logs by type, actor, time
- [ ] Timeline is visually clear and informative
- [ ] Can expand log entries to see details
- [ ] Analytics dashboard shows meaningful insights
- [ ] Logs are automatically created from Jarvis actions
- [ ] Sub-agent dispatches are tracked and linked
- [ ] Can export logs in multiple formats
- [ ] Mobile-responsive design
- [ ] No hydration errors
