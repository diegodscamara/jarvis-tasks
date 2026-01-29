# Jarvis Task Manager Roadmap

> Inspired by Linear — built for Jarvis & Diego

## 🎯 Vision

A sleek, fast task manager that Jarvis can use to track work across projects (AdPilot Pro, Luxor, Jarvis), with tight GitHub PR integration and real-time notifications.

---

## Phase 1: Foundation (Current Sprint)

### 🎨 Linear Theme System
- Dark theme as primary
- Color tokens matching Linear's palette
- Inter font, proper typography scale
- Consistent border radius (6px)
- Status colors and depth system

### 📐 Sidebar Navigation
- Collapsible sidebar (cmd+b)
- Workspace section
- Projects with icons
- Views (All, Active, Backlog)
- Team/Assignee filters

### 📁 Projects System
- Create/edit/delete projects
- Default: AdPilot Pro, Luxor, Jarvis
- Project icons and colors
- Project-based filtering

### 📊 Task Properties Extension
- Estimates (points/time)
- Due dates with calendar
- Enhanced priority system
- Status workflow customization
- Cycle/Sprint support

---

## Phase 2: Rich Content

### 📝 Rich Text Editor
Slash commands for:
- Headings (h1/h2/h3)
- Lists (bullet, numbered, checklist)
- Code blocks with syntax highlighting
- Quote blocks, dividers
- Collapsible sections
- @ mentions, # task links
- Image/video/file uploads
- GIF picker

### 🔗 Sub-issues
- Create from parent task
- Progress indicator
- Expand/collapse
- Convert between types

### 📎 Document Links
- Attach external links
- URL preview with metadata
- Resource types (Design, Spec, Doc)

---

## Phase 3: Integration & Automation

### 🔀 GitHub PR Integration
- Link PRs to tasks
- Auto-detect via branch naming (e.g., `jarvis-123-feature`)
- Show PR status (draft/open/merged)
- Auto-transition status:
  - PR opened → In Progress
  - PR in review → In Review  
  - PR merged → Done
- CI status on task card
- Commit links

### 🔔 Real-time Notifications
- WebSocket updates
- Notification center
- Types: assigned, status change, comment, mention, PR merged
- Forward to Telegram/Discord
- Preferences

### 🤖 Jarvis API
- REST API for programmatic access
- Webhooks for task events
- Natural language task creation
- Auto-categorization
- Daily summary reports

---

## Phase 4: Views & Polish

### 📋 Multiple Views
- Kanban board ✅ (current)
- List view with sorting
- Table view with inline edit
- Calendar view
- Timeline/roadmap view
- Save custom views

### ⚙️ Settings
- Theme toggle (dark/light/system)
- Notification preferences
- Workspace config
- Status workflows
- Label management
- Integrations

### ⌨️ Keyboard Shortcuts
- `c` = create task
- `j/k` = navigate
- `enter` = open
- `esc` = close
- `cmd+k` = command palette
- `/` = search
- `1-4` = set priority

---

## Phase 5: Infrastructure

### 💾 Database (Supabase)
- Move from JSON to Postgres
- Schema: tasks, projects, labels, comments
- Row-level security
- Real-time subscriptions

### 🔐 Authentication
- Supabase Auth
- OAuth (GitHub, Google)
- Role-based permissions
- Workspace invites

---

## Current Focus

1. **Theme System** — Make it look like Linear
2. **Sidebar** — Proper navigation
3. **Projects** — Organize by context
4. **PR Integration** — Automate status transitions

---

*Last updated: 2026-01-29*
