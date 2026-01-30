import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const date = todayString()
    await db.setHabitCompletion(id, date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting habit completion:', error)
    return NextResponse.json({ error: 'Failed to set completion' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? todayString()
    const removed = await db.removeHabitCompletion(id, date)
    if (!removed) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing habit completion:', error)
    return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 })
  }
}
