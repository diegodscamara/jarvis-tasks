import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// POST /api/import - Import tasks from JSON
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const data = await request.json()

    if (!data.tasks || !Array.isArray(data.tasks)) {
      return NextResponse.json(
        { error: 'Invalid import data: tasks array required' },
        { status: 400 }
      )
    }

    let imported = 0
    let skipped = 0

    // Import tasks
    for (const task of data.tasks) {
      const id = task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      const { error } = await supabase.from('tasks').upsert(
        {
          id,
          title: task.title || 'Untitled',
          description: task.description || '',
          priority: task.priority || 'medium',
          status: task.status || 'todo',
          assignee: task.assignee || 'jarvis',
          project_id: task.project_id || task.projectId || null,
          due_date: task.due_date || task.dueDate || null,
          estimate: task.estimate || null,
          created_at: task.created_at || task.createdAt || new Date().toISOString(),
          updated_at: task.updated_at || task.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (error) {
        skipped++
      } else {
        imported++
      }
    }

    // Import projects if provided
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        await supabase.from('projects').upsert(
          {
            id: project.id,
            name: project.name,
            icon: project.icon || '📁',
            color: project.color || '#808080',
            created_at: project.created_at || project.createdAt || new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      }
    }

    // Import labels if provided
    if (data.labels && Array.isArray(data.labels)) {
      for (const label of data.labels) {
        await supabase.from('labels').upsert(
          {
            id: label.id,
            name: label.name,
            color: label.color || '#808080',
            created_at: label.created_at || label.createdAt || new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} tasks (${skipped} skipped)`,
    })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 })
  }
}
