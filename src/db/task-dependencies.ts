import { and, eq, inArray } from 'drizzle-orm'
import { db } from './index'
import { taskDependencies, tasks } from './schema'

export interface DependencyValidation {
  valid: boolean
  error?: string
  cycle?: string[]
}

// Get all dependencies for a task
export async function getTaskDependencies(taskId: string): Promise<string[]> {
  const deps = await db
    .select({ dependsOnId: taskDependencies.dependsOnId })
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId))

  return deps.map((d) => d.dependsOnId)
}

// Get all tasks that depend on a specific task
export async function getTaskDependents(taskId: string): Promise<string[]> {
  const deps = await db
    .select({ taskId: taskDependencies.taskId })
    .from(taskDependencies)
    .where(eq(taskDependencies.dependsOnId, taskId))

  return deps.map((d) => d.taskId)
}

// Check if we can change a task's status based on dependencies
export async function canChangeTaskStatus(
  taskId: string,
  newStatus: string
): Promise<{ allowed: boolean; reason?: string; blockingTasks?: any[] }> {
  // Moving to done requires all dependencies to be done
  if (newStatus === 'done') {
    const dependencies = await getTaskDependencies(taskId)

    if (dependencies.length > 0) {
      const depTasks = await db.select().from(tasks).where(inArray(tasks.id, dependencies))

      const incompleteDeps = depTasks.filter((t) => t.status !== 'done')

      if (incompleteDeps.length > 0) {
        return {
          allowed: false,
          reason: 'Cannot complete task - has incomplete dependencies',
          blockingTasks: incompleteDeps.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
          })),
        }
      }
    }
  }

  // Moving from done requires checking dependents
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  const currentTask = task[0]

  if (currentTask?.status === 'done' && newStatus !== 'done') {
    const dependents = await getTaskDependents(taskId)

    if (dependents.length > 0) {
      const depTasks = await db.select().from(tasks).where(inArray(tasks.id, dependents))

      const completedDependents = depTasks.filter((t) => t.status === 'done')

      if (completedDependents.length > 0) {
        return {
          allowed: false,
          reason: 'Cannot uncomplete task - other tasks depend on it',
          blockingTasks: completedDependents.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
          })),
        }
      }
    }
  }

  return { allowed: true }
}

// Add a dependency between tasks
export async function addTaskDependency(taskId: string, dependsOnId: string): Promise<void> {
  // Check for cycles before adding
  const validation = await validateDependency(taskId, dependsOnId)

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid dependency')
  }

  const id = `dep-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await db.insert(taskDependencies).values({ id, taskId, dependsOnId })
}

// Remove a dependency
export async function removeTaskDependency(taskId: string, dependsOnId: string): Promise<void> {
  await db
    .delete(taskDependencies)
    .where(and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnId, dependsOnId)))
}

// Validate a new dependency (check for cycles)
export async function validateDependency(
  taskId: string,
  dependsOnId: string
): Promise<DependencyValidation> {
  if (taskId === dependsOnId) {
    return { valid: false, error: 'A task cannot depend on itself' }
  }

  // Check if this would create a cycle
  const visited = new Set<string>()
  const cycle = await detectCycle(dependsOnId, taskId, visited)

  if (cycle) {
    return {
      valid: false,
      error: 'This dependency would create a circular reference',
      cycle,
    }
  }

  return { valid: true }
}

// Detect cycles in dependency graph
async function detectCycle(
  start: string,
  target: string,
  visited: Set<string>,
  path: string[] = []
): Promise<string[] | null> {
  if (start === target && path.length > 0) {
    return [...path, start]
  }

  if (visited.has(start)) {
    return null
  }

  visited.add(start)
  path.push(start)

  const deps = await getTaskDependencies(start)

  for (const dep of deps) {
    const cycle = await detectCycle(dep, target, visited, [...path])
    if (cycle) {
      return cycle
    }
  }

  return null
}
