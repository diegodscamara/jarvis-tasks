import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

// POST /api/import - Import tasks from JSON
export async function POST(request: NextRequest) {
  const db = getDb()
  
  try {
    const data = await request.json()
    
    if (!data.tasks || !Array.isArray(data.tasks)) {
      db.close()
      return NextResponse.json({ error: 'Invalid import data: tasks array required' }, { status: 400 })
    }
    
    let imported = 0
    let skipped = 0
    
    const insertTask = db.prepare(`
      INSERT OR IGNORE INTO tasks (id, title, description, priority, status, assignee, project_id, due_date, estimate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const task of data.tasks) {
      // Generate new ID if not provided or if it conflicts
      const id = task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      
      try {
        insertTask.run(
          id,
          task.title || 'Untitled',
          task.description || '',
          task.priority || 'medium',
          task.status || 'todo',
          task.assignee || 'jarvis',
          task.project_id || task.projectId || null,
          task.due_date || task.dueDate || null,
          task.estimate || null,
          task.created_at || task.createdAt || new Date().toISOString(),
          task.updated_at || task.updatedAt || new Date().toISOString()
        )
        imported++
      } catch {
        skipped++
      }
    }
    
    // Import projects if provided
    if (data.projects && Array.isArray(data.projects)) {
      const insertProject = db.prepare(`
        INSERT OR IGNORE INTO projects (id, name, icon, color, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      
      for (const project of data.projects) {
        try {
          insertProject.run(
            project.id,
            project.name,
            project.icon || '📁',
            project.color || '#808080',
            project.created_at || project.createdAt || new Date().toISOString()
          )
        } catch {
          // Skip duplicates
        }
      }
    }
    
    // Import labels if provided
    if (data.labels && Array.isArray(data.labels)) {
      const insertLabel = db.prepare(`
        INSERT OR IGNORE INTO labels (id, name, color, created_at)
        VALUES (?, ?, ?, ?)
      `)
      
      for (const label of data.labels) {
        try {
          insertLabel.run(
            label.id,
            label.name,
            label.color || '#808080',
            label.created_at || label.createdAt || new Date().toISOString()
          )
        } catch {
          // Skip duplicates
        }
      }
    }
    
    db.close()
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} tasks (${skipped} skipped)`
    })
  } catch (error) {
    db.close()
    console.error('Error importing data:', error)
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 })
  }
}
