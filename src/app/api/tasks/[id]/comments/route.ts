import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

interface Comment {
  id: string
  text: string
  author: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: string
  status: string
  assignee: string
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

interface Notification {
  taskId: string
  taskTitle: string
  comment: string
  author: string
  timestamp: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json')
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'data', 'notifications.json')

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const taskId = params.id
    const comment: Comment = await request.json()

    // Read current tasks
    let tasks: Task[] = []
    try {
      const data = await readFile(DATA_FILE, 'utf-8')
      const jsonData = JSON.parse(data)
      tasks = jsonData.tasks || []
    } catch (e) {
      console.error('Error reading tasks:', e)
    }

    // Find the task and add comment
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = tasks[taskIndex]
    if (!task.comments) {
      task.comments = []
    }
    task.comments.push(comment)
    task.updatedAt = new Date().toISOString()

    // Save updated tasks
    await writeFile(DATA_FILE, JSON.stringify({ tasks }, null, 2))

    // Create notification
    const notification: Notification = {
      taskId: task.id,
      taskTitle: task.title,
      comment: comment.text,
      author: comment.author,
      timestamp: comment.createdAt
    }

    // Append to notifications file
    let notifications: Notification[] = []
    try {
      const notifData = await readFile(NOTIFICATIONS_FILE, 'utf-8')
      const lines = notifData.trim().split('\n').filter(line => line)
      notifications = lines.map(line => JSON.parse(line))
    } catch (e) {
      // File might not exist, that's okay
    }

    // Append new notification as a new line
    const notificationLine = JSON.stringify(notification) + '\n'
    await writeFile(NOTIFICATIONS_FILE, notificationLine, { flag: 'a' })

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}