import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'
import { canChangeTaskStatus, getTaskDependencies, getTaskDependents } from '@/lib/supabase/task-dependencies'
import { notifyTaskEvent } from '@/lib/telegram-notifier'

export async function GET() {
  try {
    const tasks = await db.getAllTasks()

    // Transform to match expected frontend format (camelCase)
    const formattedTasks = await Promise.all(
      tasks.map(async (task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        projectId: (task as any).projectId ?? (task as any).project_id ?? null,
        dueDate: (task as any).dueDate ?? (task as any).due_date ?? null,
        estimate: task.estimate ?? null,
        createdAt: (task as any).createdAt ?? (task as any).created_at,
        updatedAt: (task as any).updatedAt ?? (task as any).updated_at,
        // Add dependencies information
        dependsOn: await getTaskDependencies(task.id),
        blockedBy: await getTaskDependents(task.id),
      }))
    )

    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // NOTE: Supabase uses UUID primary keys; do not accept/emit legacy string ids here.
    const task = await db.createTask({
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'medium',
      status: body.status || 'todo',
      assignee: body.assignee || 'jarvis',
      projectId: body.projectId,
      dueDate: body.dueDate,
      estimate: body.estimate,
    })

    // Send Telegram notification
    await notifyTaskEvent(
      'task_created',
      task.id,
      task.title,
      task.status,
      task.assignee,
      (task as any).dueDate ?? (task as any).due_date ?? undefined,
      body.telegramChannel
    )

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      projectId: (task as any).projectId ?? (task as any).project_id ?? null,
      dueDate: (task as any).dueDate ?? (task as any).due_date ?? null,
      estimate: task.estimate ?? null,
      createdAt: (task as any).createdAt ?? (task as any).created_at,
      updatedAt: (task as any).updatedAt ?? (task as any).updated_at,
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // Get current task for notifications
    const currentTask = await db.getTaskById(id)

    // Check if status is being changed and validate dependencies
    if (updates.status) {
      if (currentTask && currentTask.status !== updates.status) {
        const validation = await canChangeTaskStatus(id, updates.status)
        if (!validation.allowed) {
          return NextResponse.json(
            {
              error: 'Status change blocked',
              reason: validation.reason,
            },
            { status: 400 }
          )
        }
      }
    }

    // Send Telegram notification for task update or completion
    if (
      currentTask &&
      updates.status &&
      updates.status === 'done' &&
      currentTask.status !== 'done'
    ) {
      await notifyTaskEvent(
        'task_completed',
        id,
        currentTask.title,
        updates.status,
        currentTask.assignee,
        (currentTask as any).dueDate ?? (currentTask as any).due_date ?? undefined,
        body.telegramChannel
      )
    } else if (currentTask && updates.status && currentTask.status !== updates.status) {
      await notifyTaskEvent(
        'task_updated',
        id,
        currentTask.title,
        updates.status,
        currentTask.assignee,
        (currentTask as any).dueDate ?? (currentTask as any).due_date ?? undefined,
        body.telegramChannel
      )
    }

    const task = await db.updateTask(id, {
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      status: updates.status,
      assignee: updates.assignee,
      projectId: updates.projectId,
      dueDate: updates.dueDate,
      estimate: updates.estimate,
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      projectId: (task as any).projectId ?? (task as any).project_id ?? null,
      dueDate: (task as any).dueDate ?? (task as any).due_date ?? null,
      estimate: task.estimate ?? null,
      createdAt: (task as any).createdAt ?? (task as any).created_at,
      updatedAt: (task as any).updatedAt ?? (task as any).updated_at,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const deleted = await db.deleteTask(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
