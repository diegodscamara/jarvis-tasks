# Jarvis Orchestrator - Sub-Agent Dispatch System

## Overview

The orchestrator enables Jarvis (Claude Opus) to delegate work to cheaper/specialized agents:

| Agent | Model | Cost | Best For |
|-------|-------|------|----------|
| jarvis | Opus | 10x | Orchestration, decisions, user comms |
| claude | Sonnet | 3x | Coding, analysis, writing |
| gemini | Gemini 2.5 Pro | 1x | Research, planning, summaries |
| copilot | GPT-4 | 2x | Git, shell, coding suggestions |

## Architecture

```
┌─────────────────────────────────────────┐
│           Jarvis Tasks UI               │
│    (Task Board + Orchestrator View)     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         /api/orchestrate                │
│    (Dispatch Engine + Tracking)         │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Gemini  │ │ Claude  │ │ Copilot │
│  (SSH)  │ │ (spawn) │ │  (CLI)  │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┴───────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Task Comments  │
        │   (Results)     │
        └─────────────────┘
```

## API Endpoints

### GET /api/orchestrate
Returns orchestrator status:
- Active sessions
- Pending dispatches
- Agent availability
- Metrics

### POST /api/orchestrate
Dispatch pending tasks:
```json
{
  "taskIds": ["task-123"],  // Optional: specific tasks
  "dryRun": false           // Optional: preview without dispatch
}
```

### PUT /api/orchestrate
Update session status (callback):
```json
{
  "taskId": "task-123",
  "status": "completed",
  "result": "Task completed successfully..."
}
```

## Data Files

- `data/active-sessions.json` - Running and recent sessions
- `data/locks.json` - File locks to prevent conflicts
- `data/orchestrator-metrics.json` - Performance metrics

## Workflow

1. **Assign Task** - Set task assignee to `gemini`, `claude`, or `copilot`
2. **Set Status** - Move task to `todo` status
3. **Dispatch** - Orchestrator checks and dispatches during heartbeat
4. **Execute** - Sub-agent works on task
5. **Report** - Sub-agent posts result as comment
6. **Complete** - Task moves to `done` or back to `todo` if failed

## Dispatch Rules

- Only `todo` tasks are dispatched
- Tasks assigned to `jarvis` or `diego` are NOT dispatched
- Each agent has max concurrent limit
- File locks prevent conflicts

## Usage from Jarvis Heartbeat

During heartbeat, check orchestrator:
```bash
curl http://localhost:3333/api/orchestrate
```

If pending dispatches exist, trigger:
```bash
curl -X POST http://localhost:3333/api/orchestrate
```

Then spawn sub-agents as needed via `sessions_spawn`.

## Metrics Tracked

- Total dispatched
- Per-agent: dispatched, completed, failed
- Average completion time per agent

## Future Improvements

- [ ] Auto-retry failed tasks
- [ ] Priority-based dispatch queue
- [ ] Load balancing across agents
- [ ] Cost tracking and budgets
- [ ] Learning from completion patterns
