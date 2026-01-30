import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

export async function GET() {
  try {
    const habits = await db.getAllHabitsWithCompletions()
    return NextResponse.json({ habits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = (body.name ?? '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }
    const habit = await db.createHabit({ name })
    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Habit id required' }, { status: 400 })
    }
    const deleted = await db.deleteHabit(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
