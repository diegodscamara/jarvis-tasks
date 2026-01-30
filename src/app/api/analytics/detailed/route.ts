import { eachDayOfInterval, format, startOfDay, startOfWeek, subDays } from 'date-fns'
import { NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET() {
  try {
    const tasks = await db.getAllTasks()
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Velocity: tasks completed per day over last 30 days
    const velocity = eachDayOfInterval({ start: thirtyDaysAgo, end: now }).map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const completed = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt &&
          new Date(t.updatedAt) >= dayStart &&
          new Date(t.updatedAt) <= dayEnd
      ).length

      return {
        date: format(day, 'yyyy-MM-dd'),
        completed,
      }
    })

    // Productivity by day of week
    const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const completed = tasks.filter((t) => {
        if (t.status !== 'done' || !t.updatedAt) return false
        return new Date(t.updatedAt).getDay() === dow
      }).length
      return { day: dayNames[dow], completed }
    })

    // Time to completion (for tasks with createdAt and done)
    const completedTasks = tasks.filter((t) => t.status === 'done' && t.createdAt && t.updatedAt)
    const avgCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime()
            const completed = new Date(t.updatedAt).getTime()
            return sum + (completed - created)
          }, 0) /
          completedTasks.length /
          (1000 * 60 * 60) // hours
        : 0

    // Status flow (how many tasks in each status)
    const statusFlow = {
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }

    // Priority distribution
    const priorityDist = {
      high: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
      medium: tasks.filter((t) => t.priority === 'medium' && t.status !== 'done').length,
      low: tasks.filter((t) => t.priority === 'low' && t.status !== 'done').length,
    }

    // Top projects by task count
    const projectCounts: Record<string, number> = {}
    tasks.forEach((t) => {
      if (t.projectId) {
        projectCounts[t.projectId] = (projectCounts[t.projectId] || 0) + 1
      }
    })
    const topProjects = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ projectId: id, count }))

    return NextResponse.json({
      velocity,
      byDayOfWeek,
      avgCompletionTimeHours: Math.round(avgCompletionTime * 10) / 10,
      statusFlow,
      priorityDistribution: priorityDist,
      topProjects,
      totalTasks: tasks.length,
      completedTotal: completedTasks.length,
      completionRate:
        tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}
