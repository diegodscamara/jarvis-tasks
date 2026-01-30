/**
 * Jarvis Orchestrator - Sub-Agent Dispatch System
 *
 * Manages task delegation to different AI agents:
 * - gemini: Research, analysis, planning (via Gemini CLI)
 * - copilot: Coding suggestions (via gh copilot)
 * - claude: Complex tasks (via sessions_spawn with Sonnet)
 * - jarvis: Orchestration only (Opus - expensive, use sparingly)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SESSIONS_FILE = path.join(DATA_DIR, 'active-sessions.json')
const LOCKS_FILE = path.join(DATA_DIR, 'locks.json')
const METRICS_FILE = path.join(DATA_DIR, 'orchestrator-metrics.json')

// Types
export interface ActiveSession {
  taskId: string
  taskTitle: string
  agent: string
  sessionKey?: string
  startedAt: string
  status: 'running' | 'completed' | 'failed'
  result?: string
  completedAt?: string
}

export interface FileLock {
  path: string
  taskId: string
  agent: string
  lockedAt: string
  expiresAt: string
}

export interface OrchestratorMetrics {
  totalDispatched: number
  byAgent: Record<string, { dispatched: number; completed: number; failed: number }>
  averageCompletionTime: Record<string, number>
  lastUpdated: string
}

// Agent capabilities and costs (relative)
export const AGENT_CONFIG = {
  jarvis: {
    model: 'opus',
    costMultiplier: 10,
    capabilities: ['orchestration', 'complex-decisions', 'user-communication'],
    maxConcurrent: 1,
  },
  claude: {
    model: 'sonnet',
    costMultiplier: 3,
    capabilities: ['coding', 'analysis', 'writing'],
    maxConcurrent: 3,
  },
  gemini: {
    model: 'gemini-2.5-pro',
    costMultiplier: 1,
    capabilities: ['research', 'analysis', 'planning', 'summarization'],
    maxConcurrent: 2,
  },
  copilot: {
    model: 'gpt-4',
    costMultiplier: 2,
    capabilities: ['coding', 'git', 'shell'],
    maxConcurrent: 1,
  },
} as const

// Helper functions
export function loadSessions(): ActiveSession[] {
  if (!existsSync(SESSIONS_FILE)) return []
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function saveSessions(sessions: ActiveSession[]): void {
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}

export function loadLocks(): FileLock[] {
  if (!existsSync(LOCKS_FILE)) return []
  try {
    const locks = JSON.parse(readFileSync(LOCKS_FILE, 'utf-8'))
    // Clean expired locks
    const now = new Date().toISOString()
    return locks.filter((l: FileLock) => l.expiresAt > now)
  } catch {
    return []
  }
}

export function saveLocks(locks: FileLock[]): void {
  writeFileSync(LOCKS_FILE, JSON.stringify(locks, null, 2))
}

export function loadMetrics(): OrchestratorMetrics {
  if (!existsSync(METRICS_FILE)) {
    return {
      totalDispatched: 0,
      byAgent: {},
      averageCompletionTime: {},
      lastUpdated: new Date().toISOString(),
    }
  }
  try {
    return JSON.parse(readFileSync(METRICS_FILE, 'utf-8'))
  } catch {
    return {
      totalDispatched: 0,
      byAgent: {},
      averageCompletionTime: {},
      lastUpdated: new Date().toISOString(),
    }
  }
}

export function saveMetrics(metrics: OrchestratorMetrics): void {
  metrics.lastUpdated = new Date().toISOString()
  writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2))
}

// Check if we can dispatch to an agent
export function canDispatch(agent: string): boolean {
  const config = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG]
  if (!config) return false

  const sessions = loadSessions()
  const activeForAgent = sessions.filter((s) => s.agent === agent && s.status === 'running').length

  return activeForAgent < config.maxConcurrent
}

// Acquire a file lock
export function acquireLock(
  filePath: string,
  taskId: string,
  agent: string,
  durationMinutes = 30
): boolean {
  const locks = loadLocks()
  const existing = locks.find((l) => l.path === filePath)

  if (existing) {
    return false // Already locked
  }

  const now = new Date()
  const expires = new Date(now.getTime() + durationMinutes * 60 * 1000)

  locks.push({
    path: filePath,
    taskId,
    agent,
    lockedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  })

  saveLocks(locks)
  return true
}

// Release a file lock
export function releaseLock(filePath: string, taskId: string): void {
  const locks = loadLocks()
  const filtered = locks.filter((l) => !(l.path === filePath && l.taskId === taskId))
  saveLocks(filtered)
}

// Record a dispatch
export function recordDispatch(
  taskId: string,
  taskTitle: string,
  agent: string,
  sessionKey?: string
): void {
  const sessions = loadSessions()
  sessions.push({
    taskId,
    taskTitle,
    agent,
    sessionKey,
    startedAt: new Date().toISOString(),
    status: 'running',
  })
  saveSessions(sessions)

  // Update metrics
  const metrics = loadMetrics()
  metrics.totalDispatched++
  if (!metrics.byAgent[agent]) {
    metrics.byAgent[agent] = { dispatched: 0, completed: 0, failed: 0 }
  }
  metrics.byAgent[agent].dispatched++
  saveMetrics(metrics)
}

// Mark a session as completed
export function completeSession(taskId: string, result: string, success = true): void {
  const sessions = loadSessions()
  const session = sessions.find((s) => s.taskId === taskId && s.status === 'running')

  if (session) {
    session.status = success ? 'completed' : 'failed'
    session.result = result
    session.completedAt = new Date().toISOString()
    saveSessions(sessions)

    // Update metrics
    const metrics = loadMetrics()
    if (metrics.byAgent[session.agent]) {
      if (success) {
        metrics.byAgent[session.agent].completed++
      } else {
        metrics.byAgent[session.agent].failed++
      }

      // Calculate average completion time
      const completedSessions = sessions.filter(
        (s) => s.agent === session.agent && s.status === 'completed' && s.completedAt
      )
      if (completedSessions.length > 0) {
        const totalTime = completedSessions.reduce((sum, s) => {
          const start = new Date(s.startedAt).getTime()
          const end = new Date(s.completedAt!).getTime()
          return sum + (end - start)
        }, 0)
        metrics.averageCompletionTime[session.agent] = totalTime / completedSessions.length
      }
    }
    saveMetrics(metrics)
  }
}

// Get pending tasks for dispatch (to be called from API)
export function getDispatchableTasks(
  tasks: Array<{ id: string; title: string; status: string; assignee: string }>
): Array<{ task: (typeof tasks)[0]; agent: string }> {
  const dispatchable: Array<{ task: (typeof tasks)[0]; agent: string }> = []
  const sessions = loadSessions()

  for (const task of tasks) {
    // Only dispatch 'todo' tasks assigned to non-jarvis agents
    if (task.status !== 'todo') continue
    if (task.assignee === 'jarvis' || task.assignee === 'diego') continue

    // Check if already dispatched
    const existing = sessions.find((s) => s.taskId === task.id && s.status === 'running')
    if (existing) continue

    // Check if we can dispatch to this agent
    if (!canDispatch(task.assignee)) continue

    dispatchable.push({ task, agent: task.assignee })
  }

  return dispatchable
}

// Generate dispatch command based on agent type
export function generateDispatchCommand(
  task: { id: string; title: string; description?: string },
  agent: string
): string {
  const taskContext = `Task ID: ${task.id}\nTitle: ${task.title}\n${task.description ? `Description: ${task.description}` : ''}`

  switch (agent) {
    case 'gemini':
      // Use Gemini CLI via Mac SSH
      return `ssh mac "source ~/.zshenv && gemini --allowed-mcp-server-names=none -p '${taskContext.replace(/'/g, "\\'")}'"`

    case 'copilot':
      // Use GitHub Copilot
      return `gh copilot suggest "${task.title.replace(/"/g, '\\"')}"`

    case 'claude':
      // Use sessions_spawn (handled differently in the API)
      return `sessions_spawn`

    default:
      return ''
  }
}
