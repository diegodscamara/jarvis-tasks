import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = db.getCommentsForTask(id)
    
    // Transform to match expected frontend format
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.created_at,
    }))
    
    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const id = body.id || `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`
    
    const comment = db.createComment({
      id,
      task_id: taskId,
      author: body.author || 'jarvis',
      content: body.content,
    })
    
    return NextResponse.json({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.created_at,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }
    
    const deleted = db.deleteComment(commentId)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
