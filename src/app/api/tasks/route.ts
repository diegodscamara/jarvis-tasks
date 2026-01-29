import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET() {
  try {
    const tasks = db.getAllTasks()
    // Transform to match expected frontend format
    const formattedTasks = tasks.map(task => ({
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
      comments: task.comments?.map(c => ({
        id: c.id,
        author: c.author,
        content: c.content,
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
    })
    
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
    
    const task = db.updateTask(id, {
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      status: updates.status,
      assignee: updates.assignee,
      projectId: updates.projectId,
      labelIds: updates.labelIds,
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
