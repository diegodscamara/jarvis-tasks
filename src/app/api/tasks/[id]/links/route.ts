import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

interface _TaskLink {
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
    // Check if it's a PR
    if (urlLower.includes('/pull/')) {
      return { type: 'github-pr', icon: '🔀' }
    }
    // Check if it's an issue
    if (urlLower.includes('/issues/')) {
      return { type: 'github-issue', icon: '🐛' }
    }
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
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params

  try {
    const { data: links, error } = await supabase
      .from('task_links')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch links', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ links })
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/links - Add a new link
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params

  try {
    const body = await request.json()
    const { url, title } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const { type, icon } = detectLinkType(url)
    const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

    // Get max position
    const { data: existingLinks } = await supabase
      .from('task_links')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1)

    const maxPosition = existingLinks?.[0] ? existingLinks[0].position : -1
    const position = maxPosition + 1

    const { data: link, error } = await supabase
      .from('task_links')
      .insert({
        id,
        task_id: taskId,
        url,
        title: title || null,
        type,
        icon,
        position,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating link:', error)
      return NextResponse.json(
        { error: 'Failed to create link', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/links - Delete a link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    const { error } = await supabase.from('task_links').delete().eq('id', linkId)

    if (error) {
      console.error('Error deleting link:', error)
      return NextResponse.json(
        { error: 'Failed to delete link', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
