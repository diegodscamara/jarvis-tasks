import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

interface TaskLink {
  id: string
  task_id: string
  url: string
  title: string | null
  type: string
  icon: string | null
  position: number
  created_at: string
}

// Detect link type from URL
function detectLinkType(url: string): { type: string; icon: string } {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('notion.so') || urlLower.includes('notion.site')) {
    return { type: 'notion', icon: '📝' }
  }
  if (urlLower.includes('docs.google.com')) {
    return { type: 'google-doc', icon: '📄' }
  }
  if (urlLower.includes('figma.com')) {
    return { type: 'figma', icon: '🎨' }
  }
  if (urlLower.includes('github.com')) {
    return { type: 'github', icon: '🐙' }
  }
  if (urlLower.includes('linear.app')) {
    return { type: 'linear', icon: '📊' }
  }
  if (urlLower.includes('slack.com')) {
    return { type: 'slack', icon: '💬' }
  }
  if (urlLower.includes('confluence') || urlLower.includes('atlassian.net')) {
    return { type: 'confluence', icon: '📚' }
  }
  
  return { type: 'link', icon: '🔗' }
}

// GET /api/tasks/[id]/links - Get all links for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  const db = getDb()
  
  try {
    const links = db.prepare(
      'SELECT * FROM task_links WHERE task_id = ? ORDER BY position ASC, created_at ASC'
    ).all(taskId) as TaskLink[]
    
    db.close()
    return NextResponse.json({ links })
  } catch (error) {
    db.close()
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/links - Add a new link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  const db = getDb()
  
  try {
    const body = await request.json()
    const { url, title } = body
    
    if (!url) {
      db.close()
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }
    
    const { type, icon } = detectLinkType(url)
    const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    
    // Get max position
    const maxPos = db.prepare(
      'SELECT MAX(position) as max FROM task_links WHERE task_id = ?'
    ).get(taskId) as { max: number | null }
    const position = (maxPos?.max ?? -1) + 1
    
    db.prepare(`
      INSERT INTO task_links (id, task_id, url, title, type, icon, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, taskId, url, title || null, type, icon, position)
    
    const link = db.prepare('SELECT * FROM task_links WHERE id = ?').get(id) as TaskLink
    
    db.close()
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    db.close()
    console.error('Error creating link:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/links - Delete a link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb()
  
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')
    
    if (!linkId) {
      db.close()
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }
    
    db.prepare('DELETE FROM task_links WHERE id = ?').run(linkId)
    
    db.close()
    return NextResponse.json({ success: true })
  } catch (error) {
    db.close()
    console.error('Error deleting link:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
