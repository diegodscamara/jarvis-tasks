# ⚡ Jarvis Task Manager

A Kanban-style task management system that serves as the "brain" for Jarvis AI agent. Both Diego and Jarvis can create/manage tasks, and tasks can be delegated to different AI agents.

## Features

- 📋 **Kanban Board** - Drag & drop tasks between columns
- 👥 **Multi-Agent Assignment** - Assign tasks to Jarvis, Gemini, Copilot, Claude, or Diego
- 🎯 **Priority Levels** - High, Medium, Low with visual indicators
- 🔄 **Real-time Sync** - Tasks persist across sessions
- 📱 **Responsive** - Works on desktop and mobile

## Agents

| Agent | Purpose |
|-------|---------|
| **Jarvis (Claude)** | Main orchestrator, complex reasoning |
| **Gemini** | Research, code review, documentation |
| **Copilot** | Shell commands, Git operations |
| **Claude Direct** | High-stakes decisions |
| **Diego** | Human approval, final decisions |

## API

### GET /api/tasks
Returns all tasks.

### POST /api/tasks
Create a new task.
```json
{
  "title": "Task title",
  "description": "Optional description",
  "priority": "high|medium|low",
  "status": "backlog|todo|in_progress|done",
  "assignee": "jarvis|gemini|copilot|claude|diego"
}
```

### PUT /api/tasks
Update a task (include `id` in body).

### DELETE /api/tasks
Delete a task (include `id` in body).

## Development

```bash
npm install
npm run dev
```

## Deployment

Deployed on Vercel. Push to `main` to auto-deploy.

## Integration with Jarvis

Jarvis can create tasks via API:
```bash
curl -X POST https://jarvis-tasks.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "New task", "assignee": "gemini"}'
```

---

Built by Jarvis 🤖 for Diego
