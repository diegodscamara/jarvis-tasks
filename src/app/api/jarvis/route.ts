import fs from 'node:fs'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

interface JarvisNotification {
  id: string
  type: string
  taskId: string
  taskTitle: string
  message: string
  author: string
  createdAt: string
  isRead: boolean
}

const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json')

function getNotifications(): JarvisNotification[] {
  try {
    if (fs.existsSync(notificationsPath)) {
      const data = fs.readFileSync(notificationsPath, 'utf-8')
      return JSON.parse(data || '[]')
    }
  } catch {
    return []
  }
  return []
}

function saveNotifications(notifications: JarvisNotification[]) {
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2))
}

// GET /api/jarvis - Get Jarvis's dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    // Get unread notifications
    const notifications = getNotifications()
    const unreadNotifications = notifications.filter((n) => !n.isRead)

    // Get tasks assigned to Jarvis
    const allTasks = await db.getAllTasks()
    const jarvisTasks = allTasks.filter((t) => t.assignee === 'jarvis' || t.assignee === 'Jarvis')

    // Get tasks by status
    const inProgress = jarvisTasks.filter((t) => t.status === 'in_progress')
    const todo = jarvisTasks.filter((t) => t.status === 'todo')
    const backlog = jarvisTasks.filter((t) => t.status === 'backlog')
    const done = jarvisTasks.filter((t) => t.status === 'done')

    // Format response based on action
    if (action === 'pending') {
      // Get tasks needing attention (notifications or in_progress)
      return NextResponse.json({
        notifications: unreadNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          taskId: n.taskId,
          taskTitle: n.taskTitle,
          message: n.message,
          author: n.author,
          createdAt: n.createdAt,
        })),
        inProgress: inProgress.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
        needsAttention: unreadNotifications.length + inProgress.length,
      })
    }

    if (action === 'stats') {
      return NextResponse.json({
        total: jarvisTasks.length,
        inProgress: inProgress.length,
        todo: todo.length,
        backlog: backlog.length,
        done: done.length,
        unreadNotifications: unreadNotifications.length,
      })
    }

    // Default: return full dashboard
    return NextResponse.json({
      stats: {
        total: jarvisTasks.length,
        inProgress: inProgress.length,
        todo: todo.length,
        backlog: backlog.length,
        done: done.length,
      },
      notifications: {
        unread: unreadNotifications.length,
        items: unreadNotifications.slice(0, 5),
      },
      tasks: {
        inProgress: inProgress.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          projectId: t.projectId,
        })),
        todo: todo.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          projectId: t.projectId,
        })),
      },
    })
  } catch (error) {
    console.error('Error in Jarvis API:', error)
    return NextResponse.json({ error: 'Failed to get Jarvis dashboard' }, { status: 500 })
  }
}

// POST /api/jarvis - Jarvis-specific actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_task': {
        // Quick task creation with Jarvis defaults
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const task = await db.createTask({
          id,
          title: body.title,
          description: body.description || '',
          priority: body.priority || 'medium',
          status: body.status || 'todo',
          assignee: body.assignee || 'jarvis',
          projectId: body.projectId,
          labelIds: body.labelIds,
          dueDate: body.dueDate,
          estimate: body.estimate,
        })
        return NextResponse.json({ success: true, task })
      }

      case 'update_status': {
        // Quick status update
        const task = await db.updateTask(body.taskId, { status: body.status })
        if (!task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, task })
      }

      case 'add_comment': {
        // Add a comment as Jarvis
        const comment = await db.createComment({
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          task_id: body.taskId,
          author: 'jarvis',
          content: body.content,
        })
        return NextResponse.json({ success: true, comment })
      }

      case 'mark_notifications_read': {
        // Mark all notifications as read
        const notifications = getNotifications()
        for (const n of notifications) {
          n.isRead = true
        }
        saveNotifications(notifications)
        return NextResponse.json({ success: true })
      }

      case 'start_task': {
        // Move task to in_progress
        const task = await db.updateTask(body.taskId, { status: 'in_progress' })
        if (!task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        // Add comment about starting
        await db.createComment({
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          task_id: body.taskId,
          author: 'jarvis',
          content: body.message || '🚀 Started working on this task.',
        })
        return NextResponse.json({ success: true, task })
      }

      case 'complete_task': {
        // Move task to done
        const task = await db.updateTask(body.taskId, { status: 'done' })
        if (!task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        // Add comment about completion
        await db.createComment({
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          task_id: body.taskId,
          author: 'jarvis',
          content: body.message || '✅ Completed this task.',
        })
        return NextResponse.json({ success: true, task })
      }

      case 'respond_to_notification': {
        // Respond to a notification by adding a comment
        const notifications = getNotifications()
        const notification = notifications.find((n) => n.id === body.notificationId)

        if (!notification) {
          return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        // Add response comment
        const comment = await db.createComment({
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          task_id: notification.taskId,
          author: 'jarvis',
          content: body.response,
        })

        // Mark notification as read
        notification.isRead = true
        saveNotifications(notifications)

        return NextResponse.json({ success: true, comment, notification })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in Jarvis API:', error)
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }
}
