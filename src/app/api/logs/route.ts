import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get('type')
  const actor = searchParams.get('actor')
  const status = searchParams.get('status')
  const sessionId = searchParams.get('sessionId')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')
  const since = searchParams.get('since') // ISO timestamp for polling

  let query = supabase
    .from('logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) {
    query = query.eq('type', type)
  }

  if (actor) {
    query = query.eq('actor', actor)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (sessionId) {
    query = query.eq('session_id', sessionId)
  }

  if (since) {
    query = query.gt('created_at', since)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    logs: data,
    total: count,
    limit,
    offset,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json()

  const {
    type,
    actor,
    title,
    description,
    context = {},
    sessionId,
    durationMs,
    status = 'completed',
    relatedType,
    relatedId,
    tags = [],
  } = body

  if (!type || !actor || !title) {
    return NextResponse.json(
      { error: 'type, actor, and title are required' },
      { status: 400 }
    )
  }

  const validTypes = ['agent_action', 'dispatch', 'task_event', 'system_event', 'message', 'error', 'success']
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('logs')
    .insert({
      type,
      actor,
      title,
      description,
      context,
      session_id: sessionId,
      duration_ms: durationMs,
      status,
      related_type: relatedType,
      related_id: relatedId,
      tags,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
