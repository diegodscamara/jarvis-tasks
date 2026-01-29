import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET() {
  try {
    const projects = db.getAllProjects()
    // Transform to match expected frontend format
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      icon: project.icon,
      color: project.color,
      description: project.description,
      lead: project.lead,
    }))
    return NextResponse.json({ projects: formattedProjects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id || `project-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const project = db.createProject({
      id,
      name: body.name,
      icon: body.icon || '📁',
      color: body.color || '#6366f1',
      description: body.description || null,
      lead: body.lead || 'jarvis',
    })

    return NextResponse.json({
      id: project.id,
      name: project.name,
      icon: project.icon,
      color: project.color,
      description: project.description,
      lead: project.lead,
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const project = db.updateProject(id, {
      name: updates.name,
      icon: updates.icon,
      color: updates.color,
      description: updates.description,
      lead: updates.lead,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      icon: project.icon,
      color: project.color,
      description: project.description,
      lead: project.lead,
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const deleted = db.deleteProject(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
