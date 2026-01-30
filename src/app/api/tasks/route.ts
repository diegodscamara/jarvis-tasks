import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'
import { notifyTaskEvent } from '@/lib/telegram-notifier'
import { canChangeTaskStatus, getTaskDependencies, getTaskDependents } from '@/lib/task-dependencies'

export async function GET() {
  try {
    const tasks = db.getAllTasks()
    // Transform to match expected frontend format
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      projectId: task.projectId,
      parentId: task.parentId,
      recurrenceType: task.recurrenceType,
      timeSpent: task.timeSpent,
      labelIds: task.labelIds,
      dueDate: task.due_date,
      estimate: task.estimate,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      // Add dependencies information
      dependsOn: getTaskDependencies(task.id),
      blockedBy: getTaskDependents(task.id),
      comments: task.comments?.map((c) => ({
        id: c.id,
        author: c.author,
        text: c.content,  // Map content to text for frontend compatibility
        createdAt: c.created_at,
      })),
    }))
    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id || `task-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const task = db.createTask({
      id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      assignee: body.assignee,
      projectId: body.projectId,
      labelIds: body.labelIds,
      dueDate: body.dueDate,
      estimate: body.estimate,
      parentId: body.parentId,
      recurrenceType: body.recurrenceType,
    })

    // Send Telegram notification
    await notifyTaskEvent('task_created', task.id, task.title, task.status, task.assignee, task.dueDate, body.telegramChannel)

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      projectId: task.projectId,
      parentId: task.parentId,
      labelIds: task.labelIds,
      dueDate: task.due_date,
      estimate: task.estimate,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
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

    // Check if status is being changed and validate dependencies
    if (updates.status) {
      const currentTask = db.getTaskById(id)
      if (currentTask && currentTask.status !== updates.status) {
        const validation = canChangeTaskStatus(id, updates.status)
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
    if (updates.status && updates.status === 'done' && currentTask.status !== 'done') {
      await notifyTaskEvent('task_completed', id, currentTask.title, updates.status, currentTask.assignee, currentTask.due_date, body.telegramChannel)
    } else if (updates.status && currentTask.status !== updates.status) {
      await notifyTaskEvent('task_updated', id, currentTask.title, updates.status, currentTask.assignee, currentTask.due_date, body.telegramChannel)
    }

    const task = db.updateTask(id, {
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      status: updates.status,
      assignee: updates.assignee,
      parentId: updates.parentId,
      projectId: updates.projectId,
      labelIds: updates.labelIds,
      dueDate: updates.dueDate,
      estimate: updates.estimate,
      timeSpent: updates.timeSpent,
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
      projectId: task.projectId,
      labelIds: task.labelIds,
      dueDate: task.due_date,
      estimate: task.estimate,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
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

    const deleted = db.deleteTask(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
