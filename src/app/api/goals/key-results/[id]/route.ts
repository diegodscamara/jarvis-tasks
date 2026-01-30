import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const kr = await db.updateKeyResult(id, {
      title: body.title,
      done: body.done,
      position: body.position,
    })
    if (!kr) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 })
    }
    return NextResponse.json(kr)
  } catch (error) {
    console.error('Error updating key result:', error)
    return NextResponse.json({ error: 'Failed to update key result' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await db.deleteKeyResult(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting key result:', error)
    return NextResponse.json({ error: 'Failed to delete key result' }, { status: 500 })
  }
}
