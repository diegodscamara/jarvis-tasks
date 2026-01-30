# ⚡ Jarvis Task Manager

A powerful Kanban-style task management system that serves as the "brain" for Jarvis AI agent. Built with Next.js, TypeScript, and Supabase for real-time collaboration between Diego and various AI agents.

## Features

- 📋 **Kanban Board** - Drag & drop tasks between columns
- 👥 **Multi-Agent Assignment** - Assign tasks to Jarvis, Gemini, Copilot, Claude, or Diego
- 🎯 **Priority Levels** - High, Medium, Low with visual indicators
- 🔄 **Real-time Sync** - Live updates via Supabase subscriptions
- 📱 **Responsive** - Works seamlessly on desktop and mobile
- 🔗 **Task Dependencies** - Manage complex workflows with dependent tasks
- 🏷️ **Labels & Projects** - Organize tasks with labels and project categories
- 💬 **Comments** - Collaborate with threaded discussions
- 🔍 **Smart Search** - Natural language search with advanced filters
- 📊 **Analytics** - Track progress and productivity metrics
- 🤖 **AI Integration** - Natural language task creation and management

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Deployment**: Vercel with edge functions
- **PWA**: Installable progressive web app with offline support

## Agents

| Agent | Purpose |
|-------|---------|
| **Jarvis (Claude)** | Main orchestrator, complex reasoning |
| **Gemini** | Research, code review, documentation |
| **Copilot** | Shell commands, Git operations |
| **Claude Direct** | High-stakes decisions |
| **Diego** | Human approval, final decisions |

## API Endpoints

### Tasks

#### GET /api/tasks
Returns all tasks with dependencies and comments.

#### POST /api/tasks
Create a new task.
```json
{
  "title": "Task title",
  "description": "Optional description",
  "priority": "high|medium|low",
  "status": "backlog|planning|todo|in_progress|review|done",
  "assignee": "jarvis|gemini|copilot|claude|diego",
  "projectId": "project-uuid",
  "labelIds": ["label-uuid"],
  "dueDate": "2024-01-15",
  "estimate": 4
}
```

#### PUT /api/tasks
Update a task (include `id` in body).

#### DELETE /api/tasks?id=task-uuid
Delete a task.

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `PUT /api/projects` - Update project
- `DELETE /api/projects?id=project-uuid` - Delete project

### Labels

- `GET /api/labels` - List all labels
- `POST /api/labels` - Create label
- `PUT /api/labels` - Update label
- `DELETE /api/labels?id=label-uuid` - Delete label

### AI Integration

#### POST /api/ai/process
Process natural language commands.
```json
{
  "message": "Create a high priority task for code review",
  "userId": "jarvis",
  "channel": "web"
}
```

### Analytics

- `GET /api/analytics` - Get task statistics
- `GET /api/analytics/detailed` - Get detailed analytics with time series data

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jarvis-tasks.git
cd jarvis-tasks
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Supabase:
   - Create a project at [supabase.com](https://app.supabase.com)
   - Run the migration script: `supabase/migrations/001_initial_schema.sql`
   - Copy `.env.example` to `.env.local` and add your credentials

4. Run the development server:
```bash
pnpm dev
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_SECRET` (optional, for authentication)
   - `TELEGRAM_BOT_TOKEN` (optional, for notifications)

3. Deploy! The app will automatically deploy on push to `main`.

### Database Migration

To migrate existing SQLite data to Supabase:

```bash
pnpm run migrate:supabase
```

## Integration with Jarvis

Jarvis can create and manage tasks via the API:

```bash
# Create a task
curl -X POST https://jarvis-tasks.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Review PR #123", "assignee": "gemini", "priority": "high"}'

# Natural language task creation
curl -X POST https://jarvis-tasks.vercel.app/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a task to deploy the new feature by Friday"}'
```

## Real-time Features

The app uses Supabase real-time subscriptions for:
- Live task updates across all connected clients
- Real-time notifications for task assignments
- Instant comment notifications
- Live analytics updates

## Security

- Row Level Security (RLS) policies protect data
- API routes validate all inputs
- Webhook endpoints verify signatures
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ by Jarvis 🤖 for Diego