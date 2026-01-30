# Task Dependencies Feature Specification

## Overview
Implement task dependency management to allow tasks to depend on other tasks, creating a proper workflow and preventing invalid status transitions.

## User Stories

### As a project manager
- I want to define task dependencies
- So that I can ensure tasks are completed in the correct order

### As a developer
- I want to see which tasks are blocking my work
- So that I can prioritize what to work on next

### As a team member
- I want to be prevented from starting blocked tasks
- So that work follows the planned sequence

## Features

### 1. Dependency Definition
- Add `dependsOn` array field to tasks
- Add `blockedBy` computed field (tasks that depend on this)
- UI to add/remove dependencies when editing tasks
- Circular dependency prevention

### 2. Status Validation
- Prevent moving task to "in_progress" if dependencies aren't "done"
- Allow moving backwards (to todo/backlog) always
- Show clear error messages when blocked

### 3. Visual Indicators
- Show dependency count on task cards
- Blocked tasks show with lock icon
- Dependency chain visualization in task detail
- Color coding for blocked vs ready tasks

### 4. Dependency Management UI
- Dropdown to select dependencies from existing tasks
- Search/filter for finding tasks to depend on
- Bulk dependency operations
- Dependency graph view (future enhancement)

## Technical Implementation

### Database Schema
```sql
-- Add to tasks table
ALTER TABLE tasks ADD COLUMN depends_on JSON DEFAULT '[]';

-- Or create separate junction table
CREATE TABLE task_dependencies (
  task_id TEXT NOT NULL,
  depends_on_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, depends_on_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### API Endpoints
- `GET /api/tasks/:id/dependencies` - Get task dependencies
- `POST /api/tasks/:id/dependencies` - Add dependency
- `DELETE /api/tasks/:id/dependencies/:depId` - Remove dependency
- `GET /api/tasks/:id/dependents` - Get tasks that depend on this

### Validation Rules
1. Cannot create circular dependencies
2. Cannot depend on deleted tasks
3. Cannot transition to active states with incomplete dependencies
4. Dependencies must be in same project (optional rule)

## UI/UX Design

### Task Card Updates
```
┌─────────────────────────────┐
│ [🔒] Task Title            │ <- Lock icon if blocked
│ Status: Blocked by 2 tasks │
│ Dependencies: 2 │ Blocking: 1│
└─────────────────────────────┘
```

### Task Detail View
```
Dependencies (2):
- ✅ Design API (done)
- ⏳ Write tests (in progress)

This task blocks (1):
- 🔒 Deploy to production
```

### Dependency Picker
- Searchable dropdown
- Shows task status inline
- Filters out circular dependencies
- Groups by project/status

## Testing Requirements

### Unit Tests ✅
- Dependency creation/deletion
- Circular dependency detection
- Status transition validation
- Depth calculation

### Integration Tests
- API endpoint validation
- Database constraint enforcement
- Multi-user dependency scenarios

### E2E Tests
- Full dependency workflow
- UI interaction tests
- Error message validation

## Success Metrics
- Reduced "blocked" time for developers
- Fewer status transition errors
- Clearer project flow visibility
- Improved task completion predictability

## Future Enhancements
1. Gantt chart view with dependencies
2. Critical path analysis
3. Automatic scheduling based on dependencies
4. Slack/email notifications when dependencies complete
5. Dependency templates for common workflows