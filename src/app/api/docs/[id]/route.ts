import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params
  const body = await request.json()

  // First, get current document to save version
  const { data: currentDoc } = await supabase
    .from('documents')
    .select('content, version')
    .eq('id', id)
    .single()

  if (currentDoc && body.content !== currentDoc.content) {
    // Save current version to history
    await supabase.from('document_versions').insert({
      document_id: id,
      content: currentDoc.content,
      version: currentDoc.version,
      created_by: 'jarvis',
    })
  }

  const { title, content, category, tags, visibility } = body

  const { data, error } = await supabase
    .from('documents')
    .update({
      ...(title && { title }),
      ...(content && { content }),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(visibility && { visibility }),
      version: (currentDoc?.version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
