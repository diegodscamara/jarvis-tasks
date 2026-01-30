import { createSupabaseServerClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

// GET /api/export?format=json|csv
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const [tasksResult, projectsResult, labelsResult, taskLabelsResult] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*'),
      supabase.from('labels').select('*'),
      supabase.from('task_labels').select('*'),
    ])

    const tasks = tasksResult.data || []
    const projects = projectsResult.data || []
    const labels = labelsResult.data || []
    const taskLabels = taskLabelsResult.data || []

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'id',
        'title',
        'description',
        'priority',
        'status',
        'assignee',
        'project_id',
        'due_date',
        'estimate',
        'created_at',
        'updated_at',
      ]
      const csvRows = [headers.join(',')]

      for (const task of tasks) {
        const row = headers.map((h) => {
          const val = (task as Record<string, unknown>)[h] ?? ''
          // Escape quotes and wrap in quotes if contains comma
          const str = String(val).replace(/"/g, '""')
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
        })
        csvRows.push(row.join(','))
      }

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="jarvis-tasks-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Default: JSON export
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      labels,
      taskLabels,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jarvis-tasks-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
