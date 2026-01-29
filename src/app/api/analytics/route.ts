import { NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET() {
  try {
    const tasks = db.getAllTasks()
    const projects = db.getAllProjects()
    const labels = db.getAllLabels()

    // Status breakdown
    const statusCounts = {
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      planning: tasks.filter((t) => t.status === 'planning').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }

    // Priority breakdown
    const priorityCounts = {
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    }

    // Project breakdown
    const projectStats = projects.map((project) => ({
      id: project.id,
      name: project.name,
      icon: project.icon,
      color: project.color,
      total: tasks.filter((t) => t.projectId === project.id).length,
      done: tasks.filter((t) => t.projectId === project.id && t.status === 'done').length,
      inProgress: tasks.filter((t) => t.projectId === project.id && t.status === 'in_progress')
        .length,
    }))

    // Tasks without project
    const unassignedTasks = tasks.filter((t) => !t.projectId).length

    // Label usage
    const labelStats = labels
      .map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        count: tasks.filter((t) => t.labelIds?.includes(label.id)).length,
      }))
      .sort((a, b) => b.count - a.count)

    // Assignee breakdown
    const assigneeCounts: Record<string, { total: number; done: number; inProgress: number }> = {}
    tasks.forEach((task) => {
      const assignee = task.assignee || 'unassigned'
      if (!assigneeCounts[assignee]) {
        assigneeCounts[assignee] = { total: 0, done: 0, inProgress: 0 }
      }
      assigneeCounts[assignee].total++
      if (task.status === 'done') assigneeCounts[assignee].done++
      if (task.status === 'in_progress') assigneeCounts[assignee].inProgress++
    })

    // Completion rate
    const completionRate =
      tasks.length > 0 ? Math.round((statusCounts.done / tasks.length) * 100) : 0

    // Tasks with due dates
    const tasksWithDueDate = tasks.filter((t) => t.due_date)
    const overdueTasks = tasksWithDueDate.filter(
      (t) => t.status !== 'done' && new Date(t.due_date!) < new Date()
    ).length

    // Recently completed (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentlyCompleted = tasks.filter(
      (t) => t.status === 'done' && new Date(t.updated_at) > sevenDaysAgo
    ).length

    return NextResponse.json({
      overview: {
        total: tasks.length,
        completionRate,
        overdue: overdueTasks,
        recentlyCompleted,
      },
      status: statusCounts,
      priority: priorityCounts,
      projects: projectStats,
      unassignedTasks,
      labels: labelStats.slice(0, 10),
      assignees: assigneeCounts,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
