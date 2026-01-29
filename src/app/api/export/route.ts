import { type NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

// GET /api/export?format=json|csv
export async function GET(request: NextRequest) {
  const db = getDb()
  
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
    const projects = db.prepare('SELECT * FROM projects').all()
    const labels = db.prepare('SELECT * FROM labels').all()
    const taskLabels = db.prepare('SELECT * FROM task_labels').all()
    
    db.close()
    
    if (format === 'csv') {
      // Generate CSV
      const headers = ['id', 'title', 'description', 'priority', 'status', 'assignee', 'project_id', 'due_date', 'estimate', 'created_at', 'updated_at']
      const csvRows = [headers.join(',')]
      
      for (const task of tasks as any[]) {
        const row = headers.map(h => {
          const val = task[h] ?? ''
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
    db.close()
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
