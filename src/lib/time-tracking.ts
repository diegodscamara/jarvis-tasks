import { endOfWeek, isWithinInterval, startOfWeek } from 'date-fns'
import type { Task } from '@/types'

export interface TimeSession {
  id: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number // in minutes
}

export interface TaskMetrics {
  taskId: string
  estimate: number // in hours
  timeSpent: number // in hours
  accuracy: number // percentage
  velocity: number // points per hour
}

export interface SprintMetrics {
  totalEstimate: number
  totalSpent: number
  completedTasks: number
  averageAccuracy: number
  velocity: number
  burndownData: Array<{
    date: string
    remainingEstimate: number
    actualRemaining: number
  }>
}

// Calculate time difference in minutes
export function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

// Format duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

// Convert estimate points to hours (configurable conversion rate)
export function pointsToHours(points: number, hoursPerPoint: number = 1): number {
  return points * hoursPerPoint
}

// Calculate task completion metrics
export function calculateTaskMetrics(task: Task): TaskMetrics | null {
  if (!task.estimate) return null

  const estimate = task.estimate
  const timeSpent = task.timeSpent || 0

  // Calculate accuracy (how close the estimate was)
  const accuracy =
    timeSpent > 0 ? Math.max(0, 100 - Math.abs((timeSpent - estimate) / estimate) * 100) : 0

  // Calculate velocity (points completed per hour spent)
  const velocity = timeSpent > 0 ? estimate / timeSpent : 0

  return {
    taskId: task.id,
    estimate,
    timeSpent,
    accuracy,
    velocity,
  }
}

// Calculate sprint/weekly metrics
export function calculateSprintMetrics(
  tasks: Task[],
  startDate: Date,
  endDate: Date
): SprintMetrics {
  const sprintTasks = tasks.filter((task) => {
    const updatedDate = new Date(task.updatedAt)
    return isWithinInterval(updatedDate, { start: startDate, end: endDate })
  })

  let totalEstimate = 0
  let totalSpent = 0
  let completedEstimate = 0
  let completedSpent = 0
  let accuracySum = 0
  let accuracyCount = 0

  sprintTasks.forEach((task) => {
    if (task.estimate) {
      totalEstimate += task.estimate

      if (task.status === 'done') {
        completedEstimate += task.estimate

        if (task.timeSpent) {
          completedSpent += task.timeSpent
          const metrics = calculateTaskMetrics(task)
          if (metrics) {
            accuracySum += metrics.accuracy
            accuracyCount++
          }
        }
      }

      if (task.timeSpent) {
        totalSpent += task.timeSpent
      }
    }
  })

  const completedTasks = sprintTasks.filter((t) => t.status === 'done').length
  const averageAccuracy = accuracyCount > 0 ? accuracySum / accuracyCount : 0
  const velocity = completedSpent > 0 ? completedEstimate / completedSpent : 0

  // Calculate burndown data (simplified - in production would track daily)
  const burndownData = calculateBurndown(sprintTasks, startDate, endDate)

  return {
    totalEstimate,
    totalSpent,
    completedTasks,
    averageAccuracy,
    velocity,
    burndownData,
  }
}

// Calculate burndown chart data
function calculateBurndown(
  tasks: Task[],
  startDate: Date,
  endDate: Date
): SprintMetrics['burndownData'] {
  const data: SprintMetrics['burndownData'] = []
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  // Get initial estimate
  const totalEstimate = tasks.reduce((sum, task) => sum + (task.estimate || 0), 0)

  // Simulate daily burndown (in production, would use actual daily snapshots)
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)

    // Calculate remaining work as of this date
    const remainingTasks = tasks.filter((task) => {
      if (task.status === 'done') {
        const doneDate = new Date(task.updatedAt)
        return doneDate > currentDate
      }
      return true
    })

    const remainingEstimate = remainingTasks.reduce((sum, task) => sum + (task.estimate || 0), 0)

    // Ideal burndown (linear)
    const idealRemaining = totalEstimate * (1 - i / days)

    data.push({
      date: currentDate.toISOString(),
      remainingEstimate: idealRemaining,
      actualRemaining: remainingEstimate,
    })
  }

  return data
}

// Get weekly velocity trend
export function getVelocityTrend(
  tasks: Task[],
  weeks: number = 4
): Array<{
  week: string
  velocity: number
  tasksCompleted: number
}> {
  const trend = []
  const now = new Date()

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const metrics = calculateSprintMetrics(tasks, startOfWeek(weekStart), endOfWeek(weekEnd))

    trend.push({
      week: `Week ${i + 1}`,
      velocity: metrics.velocity,
      tasksCompleted: metrics.completedTasks,
    })
  }

  return trend.reverse()
}

// Estimate completion date based on velocity
export function estimateCompletionDate(
  remainingEstimate: number,
  velocity: number,
  hoursPerDay: number = 8
): Date | null {
  if (velocity <= 0) return null

  const remainingHours = remainingEstimate / velocity
  const remainingDays = Math.ceil(remainingHours / hoursPerDay)

  const completionDate = new Date()
  completionDate.setDate(completionDate.getDate() + remainingDays)

  // Skip weekends
  let daysAdded = 0
  const currentDate = new Date()

  while (daysAdded < remainingDays) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return currentDate
}
