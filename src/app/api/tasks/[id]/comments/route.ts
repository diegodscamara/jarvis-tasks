import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, props: RouteParams) {
  const params = await props.params
  const { id } = params
  try {
    const comments = await db.getCommentsForTask(id)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, props: RouteParams) {
  const params = await props.params
  const { id: taskId } = params
  try {
    const body = await request.json()
    const id = body.id || `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const comment = await db.createComment({
      id,
      task_id: taskId,
      author: body.author || 'Anonymous',
      content: body.content || body.text, // Support both 'content' (current frontend) and 'text' (legacy)
    })

    // Return in frontend expected format
    return NextResponse.json({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      text: comment.content, // Include both for compatibility
      createdAt: (comment as any).createdAt ?? (comment as any).created_at,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    const deleted = await db.deleteComment(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
