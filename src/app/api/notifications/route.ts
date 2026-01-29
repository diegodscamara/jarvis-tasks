import fs from 'node:fs'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'

interface Notification {
  id: string
  type: 'comment' | 'task_assigned' | 'task_updated' | 'mention'
  taskId: string
  taskTitle: string
  message: string
  author: string
  createdAt: string
  isRead: boolean
}

const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json')

function getNotifications(): Notification[] {
  try {
    if (fs.existsSync(notificationsPath)) {
      const data = fs.readFileSync(notificationsPath, 'utf-8')
      return JSON.parse(data || '[]')
    }
  } catch (e) {
    console.error('Error reading notifications:', e)
  }
  return []
}

function saveNotifications(notifications: Notification[]) {
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2))
}

// GET - Get all notifications (optionally filtered by unread)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let notifications = getNotifications()

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead)
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const notifications = getNotifications()

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: body.type || 'comment',
      taskId: body.taskId,
      taskTitle: body.taskTitle || '',
      message: body.message,
      author: body.author || 'unknown',
      createdAt: new Date().toISOString(),
      isRead: false,
    }

    notifications.push(notification)
    saveNotifications(notifications)

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const notifications = getNotifications()

    if (body.markAllRead) {
      // Mark all as read
      for (const n of notifications) {
        n.isRead = true
      }
    } else if (body.id) {
      // Mark specific notification as read
      const notification = notifications.find((n) => n.id === body.id)
      if (notification) {
        notification.isRead = true
      }
    }

    saveNotifications(notifications)

    return NextResponse.json({
      success: true,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// DELETE - Clear all notifications
export async function DELETE() {
  try {
    saveNotifications([])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }
}
