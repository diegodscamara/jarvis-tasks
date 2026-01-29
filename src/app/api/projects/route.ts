import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'projects.json')

export interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  lead: string
  createdAt: string
}

function loadProjects(): Project[] {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data).projects || []
    }
  } catch (e) {
    console.error('Failed to load projects', e)
  }
  return []
}

function saveProjects(projects: Project[]) {
  writeFileSync(DATA_FILE, JSON.stringify({ projects }, null, 2))
}

export async function GET() {
  const projects = loadProjects()
  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const projects = loadProjects()
  
  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name: body.name,
    description: body.description || '',
    icon: body.icon || '📁',
    color: body.color || '#5E6AD2',
    lead: body.lead || 'diego',
    createdAt: new Date().toISOString(),
  }
  
  projects.push(newProject)
  saveProjects(projects)
  
  return NextResponse.json({ project: newProject })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const projects = loadProjects()
  
  const index = projects.findIndex(p => p.id === body.id)
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  projects[index] = { ...projects[index], ...body }
  saveProjects(projects)
  
  return NextResponse.json({ project: projects[index] })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  let projects = loadProjects()
  
  projects = projects.filter(p => p.id !== body.id)
  saveProjects(projects)
  
  return NextResponse.json({ success: true })
}
