import { endOfWeek, startOfDay, startOfWeek, subDays } from 'date-fns'
import { NextResponse } from 'next/server'
import * as db from '@/lib/supabase/queries'

export async function GET() {
  try {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const today = startOfDay(now)

    const allTasks = await db.getAllTasks()

    // Completed this week
    const completedThisWeek = allTasks.filter(
      (t) =>
        t.status === 'done' &&
        ((t as any).updatedAt ?? (t as any).updated_at) &&
        new Date((t as any).updatedAt ?? (t as any).updated_at) >= weekStart &&
        new Date((t as any).updatedAt ?? (t as any).updated_at) <= weekEnd
    ).length

    // Overdue tasks
    const overdueCount = allTasks.filter(
      (t) =>
        t.status !== 'done' &&
        (((t as any).dueDate ?? (t as any).due_date) as string | null | undefined) &&
        new Date(((t as any).dueDate ?? (t as any).due_date) as string) < today
    ).length

    // Due this week (upcoming)
    const upcomingCount = allTasks.filter(
      (t) =>
        t.status !== 'done' &&
        (((t as any).dueDate ?? (t as any).due_date) as string | null | undefined) &&
        new Date(((t as any).dueDate ?? (t as any).due_date) as string) >= today &&
        new Date(((t as any).dueDate ?? (t as any).due_date) as string) <= weekEnd
    ).length

    // Calculate streak (days with at least one completed task)
    let streak = 0
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(now, i)
      const dayStart = startOfDay(checkDate)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const completedOnDay = allTasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt &&
          new Date(t.updatedAt) >= dayStart &&
          new Date(t.updatedAt) <= dayEnd
      ).length

      if (completedOnDay > 0) {
        streak++
      } else if (i > 0) {
        break // Streak broken
      }
    }

    return NextResponse.json({
      completedThisWeek,
      overdueCount,
      upcomingCount,
      streak,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
