import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/templates - List all templates
export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: templates, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ templates: [] })
  }

  return NextResponse.json({
    templates:
      templates?.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        priority: t.priority,
        assignee: t.assignee,
        projectId: t.project_id,
        estimate: t.estimate,
        createdAt: t.created_at,
      })) || [],
  })
}

// POST /api/templates - Create a template
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json()

  const { name, description, priority, assignee, projectId, estimate } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      name,
      description: description || '',
      priority: priority || 'medium',
      assignee: assignee || 'jarvis',
      project_id: projectId || null,
      estimate: estimate || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      name: data.name,
      description: data.description,
      priority: data.priority,
      assignee: data.assignee,
      projectId: data.project_id,
      estimate: data.estimate,
      createdAt: data.created_at,
    },
    { status: 201 }
  )
}

// DELETE /api/templates?id=xxx - Delete a template
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
  }

  const { error } = await supabase.from('task_templates').delete().eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
