import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Extract task ID from branch name
function extractTaskIdFromBranch(branch: string): string | null {
  // Look for patterns like: roadmap-009, TASK-123, task-456
  const patterns = [/roadmap-(\d{3,4})/i, /task[-_]?(\d+)/i, /issue[-_]?(\d+)/i, /^(\d+)[-_]/]

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

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

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
        return NextResponse.json({ message: 'Event ignored' })
      }

      // Extract task ID from branch name
      const branch = pull_request.head.ref
      const taskId = extractTaskIdFromBranch(branch)

      if (!taskId) {
        console.log(`No task ID found in branch: ${branch}`)
        return NextResponse.json({ message: 'No task ID in branch name' })
      }

      // Check if task exists
      const { data: task } = await supabase.from('tasks').select('id').eq('id', taskId).single()

      if (!task) {
        console.log(`Task not found: ${taskId}`)
        return NextResponse.json({ message: 'Task not found' })
      }

      // Check if this PR is already linked
      const { data: existingLink } = await supabase
        .from('task_links')
        .select('id')
        .eq('task_id', taskId)
        .eq('url', pull_request.html_url)
        .single()

      if (existingLink) {
        console.log(`PR already linked to task ${taskId}`)
        return NextResponse.json({ message: 'PR already linked' })
      }

      // Get max position
      const { data: maxPosData } = await supabase
        .from('task_links')
        .select('position')
        .eq('task_id', taskId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      const position = (maxPosData?.position ?? -1) + 1
      const title = `PR #${pull_request.number}: ${pull_request.title}`

      // Add the PR as a link
      const { error } = await supabase.from('task_links').insert({
        task_id: taskId,
        url: pull_request.html_url,
        title,
        type: 'github-pr',
        icon: '🔀',
        position,
      })

      if (error) {
        console.error('Error linking PR:', error)
        return NextResponse.json({ error: 'Failed to link PR' }, { status: 500 })
      }

      console.log(`Auto-linked PR #${pull_request.number} to task ${taskId}`)

      return NextResponse.json({
        message: 'PR linked successfully',
        taskId,
        prNumber: pull_request.number,
      })
    }

    return NextResponse.json({ message: 'Event processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
