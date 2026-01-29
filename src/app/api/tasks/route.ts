import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'tasks.json')

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
  priority: 'high' | 'medium' | 'low'
  status: 'backlog' | 'todo' | 'in_progress' | 'done'
  assignee: string
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

function loadTasks(): Task[] {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data).tasks || []
    }
  } catch (e) {
    console.error('Failed to load tasks', e)
  }
  return []
}

function saveTasks(tasks: Task[]) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true })
  }
  writeFileSync(DATA_FILE, JSON.stringify({ tasks }, null, 2))
}

export async function GET() {
  const tasks = loadTasks()
  return NextResponse.json({ tasks })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const tasks = loadTasks()
  
  const newTask: Task = {
    id: `task-${Date.now()}`,
    title: body.title,
    description: body.description || '',
    priority: body.priority || 'medium',
    status: body.status || 'todo',
    assignee: body.assignee || 'jarvis',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: body.comments || []
  }
  
  tasks.push(newTask)
  saveTasks(tasks)
  
  return NextResponse.json({ task: newTask })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const tasks = loadTasks()
  
  const index = tasks.findIndex(t => t.id === body.id)
  if (index === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  tasks[index] = {
    ...tasks[index],
    ...body,
    updatedAt: new Date().toISOString(),
  }
  
  saveTasks(tasks)
  return NextResponse.json({ task: tasks[index] })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  let tasks = loadTasks()
  
  tasks = tasks.filter(t => t.id !== body.id)
  saveTasks(tasks)
  
  return NextResponse.json({ success: true })
}
