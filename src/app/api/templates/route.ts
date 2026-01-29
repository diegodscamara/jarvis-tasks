import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

interface Template {
  id: string
  name: string
  description: string
  priority: string
  assignee: string
  project_id: string | null
  estimate: number | null
  created_at: string
}

// GET /api/templates - List all templates
export async function GET() {
  const db = getDb()
  
  try {
    const templates = db.prepare('SELECT * FROM task_templates ORDER BY name ASC').all() as Template[]
    db.close()
    
    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        priority: t.priority,
        assignee: t.assignee,
        projectId: t.project_id,
        estimate: t.estimate,
        createdAt: t.created_at,
      }))
    })
  } catch (error) {
    db.close()
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  const db = getDb()
  
  try {
    const body = await request.json()
    const { name, description, priority, assignee, projectId, estimate } = body
    
    if (!name) {
      db.close()
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }
    
    const id = `template-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    
    db.prepare(`
      INSERT INTO task_templates (id, name, description, priority, assignee, project_id, estimate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', priority || 'medium', assignee || 'jarvis', projectId || null, estimate || null)
    
    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as Template
    db.close()
    
    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      priority: template.priority,
      assignee: template.assignee,
      projectId: template.project_id,
      estimate: template.estimate,
      createdAt: template.created_at,
    }, { status: 201 })
  } catch (error) {
    db.close()
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

// DELETE /api/templates?id=xxx - Delete a template
export async function DELETE(request: NextRequest) {
  const db = getDb()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      db.close()
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }
    
    db.prepare('DELETE FROM task_templates WHERE id = ?').run(id)
    db.close()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    db.close()
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
