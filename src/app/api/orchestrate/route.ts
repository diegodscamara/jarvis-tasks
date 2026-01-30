/**
 * Orchestrator API - Dispatch tasks to sub-agents
 *
 * GET /api/orchestrate - Get orchestrator status and pending dispatches
 * POST /api/orchestrate - Dispatch pending tasks to sub-agents
 * PUT /api/orchestrate - Update session status (for sub-agent callbacks)
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  AGENT_CONFIG,
  canDispatch,
  completeSession,
  getDispatchableTasks,
  loadMetrics,
  loadSessions,
  recordDispatch,
} from '@/lib/orchestrator'

// GET - Status and pending dispatches
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const sessions = loadSessions()
    const metrics = loadMetrics()

    // Get all todo tasks
    const { data: todoTasks, error } = await supabase
      .from('tasks')
      .select('id, title, status, assignee, description')
      .eq('status', 'todo')

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const dispatchable = getDispatchableTasks(
      (todoTasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignee: t.assignee,
      }))
    )

    // Agent availability
    const agentStatus = Object.entries(AGENT_CONFIG).map(([agent, config]) => ({
      agent,
      maxConcurrent: config.maxConcurrent,
      active: sessions.filter((s) => s.agent === agent && s.status === 'running').length,
      canDispatch: canDispatch(agent),
    }))

    return NextResponse.json({
      status: 'ok',
      activeSessions: sessions.filter((s) => s.status === 'running'),
      recentCompleted: sessions
        .filter((s) => s.status === 'completed')
        .slice(-10)
        .reverse(),
      pendingDispatch: dispatchable.map((d) => ({
        taskId: d.task.id,
        title: d.task.title,
        agent: d.agent,
      })),
      agents: agentStatus,
      metrics,
    })
  } catch (error) {
    console.error('Orchestrator GET error:', error)
    return NextResponse.json({ error: 'Failed to get orchestrator status' }, { status: 500 })
  }
}

// POST - Dispatch tasks to sub-agents
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json().catch(() => ({}))
    const { taskIds, dryRun = false } = body as { taskIds?: string[]; dryRun?: boolean }

    // Get tasks to dispatch
    let query = supabase
      .from('tasks')
      .select('id, title, status, assignee, description')
      .eq('status', 'todo')

    if (taskIds && taskIds.length > 0) {
      query = query.in('id', taskIds)
    }

    const { data: todoTasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const dispatchable = getDispatchableTasks(
      (todoTasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignee: t.assignee,
        description: t.description,
      }))
    )

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldDispatch: dispatchable.map((d) => ({
          taskId: d.task.id,
          title: d.task.title,
          agent: d.agent,
        })),
      })
    }

    const dispatched: Array<{ taskId: string; title: string; agent: string; method: string }> = []

    for (const { task, agent } of dispatchable) {
      // Record the dispatch
      recordDispatch(task.id, task.title, agent)

      // Update task status to in_progress
      await supabase
        .from('tasks')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', task.id)

      dispatched.push({
        taskId: task.id,
        title: task.title,
        agent,
        method: agent === 'claude' ? 'sessions_spawn' : 'cli',
      })
    }

    return NextResponse.json({
      success: true,
      dispatched,
      message: `Dispatched ${dispatched.length} tasks`,
    })
  } catch (error) {
    console.error('Orchestrator POST error:', error)
    return NextResponse.json({ error: 'Failed to dispatch tasks' }, { status: 500 })
  }
}

// PUT - Update session status (callback from sub-agents)
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const { taskId, status, result } = body as {
      taskId: string
      status: 'completed' | 'failed'
      result?: string
    }

    if (!taskId || !status) {
      return NextResponse.json({ error: 'taskId and status required' }, { status: 400 })
    }

    // Update session
    completeSession(taskId, result || '', status === 'completed')

    // Update task status
    const newStatus = status === 'completed' ? 'done' : 'todo' // Reset to todo if failed
    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // If result provided, add as comment
    if (result) {
      await supabase.from('comments').insert({
        task_id: taskId,
        author: 'Jarvis',
        content: `## Agent Result\n\n${result}`,
      })
    }

    return NextResponse.json({
      success: true,
      taskId,
      newStatus,
    })
  } catch (error) {
    console.error('Orchestrator PUT error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
