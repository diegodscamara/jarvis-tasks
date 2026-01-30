import { type NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

// Extract task ID from branch name
function extractTaskIdFromBranch(branch: string): string | null {
  // Look for patterns like: roadmap-009, TASK-123, task-456
  const patterns = [
    /roadmap-(\d{3,4})/i,
    /task[-_]?(\d+)/i,
    /issue[-_]?(\d+)/i,
    /^(\d+)[-_]/,
  ]
  
  for (const pattern of patterns) {
    const match = branch.match(pattern)
    if (match) {
      const id = match[1]
      // Check if we need to prepend 'roadmap-' for roadmap tasks
      if (pattern === patterns[0]) {
        return `roadmap-${id}`
      }
      return id
    }
  }
  
  return null
}

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  const db = getDb()
  
  try {
    // Get webhook secret from env
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.warn('GitHub webhook secret not configured')
    }
    
    // Get raw body for signature verification
    const body = await request.text()
    
    // Verify signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('x-hub-signature-256')
      if (!verifySignature(body, signature, webhookSecret)) {
        db.close()
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
    
    const payload = JSON.parse(body)
    const eventType = request.headers.get('x-github-event')
    
    // Handle pull_request events
    if (eventType === 'pull_request') {
      const { action, pull_request } = payload
      
      // We're interested in opened, reopened, and synchronize actions
      if (!['opened', 'reopened', 'synchronize'].includes(action)) {
        db.close()
        return NextResponse.json({ message: 'Event ignored' })
      }
      
      // Extract task ID from branch name
      const branch = pull_request.head.ref
      const taskId = extractTaskIdFromBranch(branch)
      
      if (!taskId) {
        console.log(`No task ID found in branch: ${branch}`)
        db.close()
        return NextResponse.json({ message: 'No task ID in branch name' })
      }
      
      // Check if task exists
      const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId)
      if (!task) {
        console.log(`Task not found: ${taskId}`)
        db.close()
        return NextResponse.json({ message: 'Task not found' })
      }
      
      // Check if this PR is already linked
      const existingLink = db.prepare(
        'SELECT id FROM task_links WHERE task_id = ? AND url = ?'
      ).get(taskId, pull_request.html_url)
      
      if (existingLink) {
        console.log(`PR already linked to task ${taskId}`)
        db.close()
        return NextResponse.json({ message: 'PR already linked' })
      }
      
      // Add the PR as a link
      const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      const title = `PR #${pull_request.number}: ${pull_request.title}`
      
      // Get max position
      const maxPos = db.prepare(
        'SELECT MAX(position) as max FROM task_links WHERE task_id = ?'
      ).get(taskId) as { max: number | null }
      const position = (maxPos?.max ?? -1) + 1
      
      db.prepare(`
        INSERT INTO task_links (id, task_id, url, title, type, icon, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(linkId, taskId, pull_request.html_url, title, 'github-pr', '🔀', position)
      
      console.log(`Auto-linked PR #${pull_request.number} to task ${taskId}`)
      
      db.close()
      return NextResponse.json({ 
        message: 'PR linked successfully',
        taskId,
        prNumber: pull_request.number
      })
    }
    
    db.close()
    return NextResponse.json({ message: 'Event processed' })
  } catch (error) {
    db.close()
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}