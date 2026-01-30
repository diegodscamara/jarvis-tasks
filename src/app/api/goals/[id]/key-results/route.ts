import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: goalId } = await params
    const body = await request.json()
    const count = await db.getKeyResultsForGoal(goalId).then((r) => r.length)
    const kr = await db.createKeyResult({
      goal_id: goalId,
      title: body.title ?? '',
      done: false,
      position: count,
    })
    return NextResponse.json(kr)
  } catch (error) {
    console.error('Error creating key result:', error)
    return NextResponse.json({ error: 'Failed to create key result' }, { status: 500 })
  }
}
