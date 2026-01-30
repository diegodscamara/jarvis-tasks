import { NextResponse } from "next/server"
import * as db from "@/db/queries"
import { startOfWeek, endOfWeek, startOfDay, subDays } from "date-fns"

export async function GET() {
  try {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const today = startOfDay(now)

    const allTasks = db.getAllTasks()

    // Completed this week
    const completedThisWeek = allTasks.filter(
      (t) =>
        t.status === "done" &&
        t.updated_at &&
        new Date(t.updated_at) >= weekStart &&
        new Date(t.updated_at) <= weekEnd
    ).length

    // Overdue tasks
    const overdueCount = allTasks.filter(
      (t) =>
        t.status !== "done" &&
        t.due_date &&
        new Date(t.due_date) < today
    ).length

    // Due this week (upcoming)
    const upcomingCount = allTasks.filter(
      (t) =>
        t.status !== "done" &&
        t.due_date &&
        new Date(t.due_date) >= today &&
        new Date(t.due_date) <= weekEnd
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
          t.status === "done" &&
          t.updated_at &&
          new Date(t.updated_at) >= dayStart &&
          new Date(t.updated_at) <= dayEnd
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
    console.error("Stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
