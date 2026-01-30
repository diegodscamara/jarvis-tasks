import Database from 'better-sqlite3'
import path from 'path'

function getDb() {
  const dbPath = path.join(process.cwd(), 'data', 'jarvis-tasks.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  return db
}

export interface TaskDependency {
  task_id: string
  depends_on_id: string
  created_at: string
}

export interface DependencyValidation {
  valid: boolean
  error?: string
  cycle?: string[]
}

// Get all dependencies for a task
export function getTaskDependencies(taskId: string): string[] {
  const db = getDb()
  const dependencies = db
    .prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?')
    .all(taskId) as { depends_on_id: string }[]
  db.close()

  return dependencies.map((d) => d.depends_on_id)
}

// Get all tasks that depend on a specific task
export function getTaskDependents(taskId: string): string[] {
  const db = getDb()
  const dependents = db
    .prepare('SELECT task_id FROM task_dependencies WHERE depends_on_id = ?')
    .all(taskId) as { task_id: string }[]
  db.close()

  return dependents.map((d) => d.task_id)
}

// Add a dependency
export function addTaskDependency(taskId: string, dependsOnId: string): boolean {
  // First validate that this won't create a circular dependency
  const validation = validateDependency(taskId, dependsOnId)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const db = getDb()
  try {
    db.prepare('INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)').run(
      taskId,
      dependsOnId
    )
    db.close()
    return true
  } catch (error) {
    db.close()
    throw error
  }
}

// Remove a dependency
export function removeTaskDependency(taskId: string, dependsOnId: string): boolean {
  const db = getDb()
  const result = db
    .prepare('DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?')
    .run(taskId, dependsOnId)
  db.close()

  return result.changes > 0
}

// Validate that adding a dependency won't create a cycle
export function validateDependency(taskId: string, newDependsOnId: string): DependencyValidation {
  const db = getDb()

  try {
    // Build the dependency graph
    const allDependencies = db
      .prepare('SELECT task_id, depends_on_id FROM task_dependencies')
      .all() as TaskDependency[]

    // Check if adding this dependency would create a cycle
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (currentId: string, path: string[] = []): string[] | null => {
      if (recursionStack.has(currentId)) {
        const cycleStart = path.indexOf(currentId)
        return path.slice(cycleStart).concat(currentId)
      }

      if (visited.has(currentId)) return null

      visited.add(currentId)
      recursionStack.add(currentId)
      path.push(currentId)

      // Get dependencies for current task
      const deps = allDependencies
        .filter((d) => d.task_id === currentId)
        .map((d) => d.depends_on_id)

      // Include the new dependency if we're checking the original task
      if (currentId === taskId && !deps.includes(newDependsOnId)) {
        deps.push(newDependsOnId)
      }

      for (const depId of deps) {
        const cycle = hasCycle(depId, [...path])
        if (cycle) return cycle
      }

      recursionStack.delete(currentId)
      return null
    }

    const cycle = hasCycle(taskId)

    if (cycle) {
      return {
        valid: false,
        error: 'Circular dependency detected',
        cycle,
      }
    }

    return { valid: true }
  } finally {
    db.close()
  }
}

// Check if a task can change status based on its dependencies
export function canChangeTaskStatus(
  taskId: string,
  newStatus: string
): { allowed: boolean; reason?: string } {
  // Moving backwards is always allowed
  if (['todo', 'backlog', 'planning'].includes(newStatus)) {
    return { allowed: true }
  }

  // For forward movement, check dependencies
  const dependencies = getTaskDependencies(taskId)

  if (dependencies.length === 0) {
    return { allowed: true }
  }

  const db = getDb()

  try {
    // Check if all dependencies are complete
    const incompleteDeps: string[] = []

    for (const depId of dependencies) {
      const dep = db.prepare('SELECT id, status, title FROM tasks WHERE id = ?').get(depId) as
        | {
            id: string
            status: string
            title: string
          }
        | undefined

      if (!dep || dep.status !== 'done') {
        incompleteDeps.push(dep?.title || depId)
      }
    }

    if (incompleteDeps.length > 0) {
      return {
        allowed: false,
        reason: `Blocked by incomplete dependencies: ${incompleteDeps.join(', ')}`,
      }
    }

    return { allowed: true }
  } finally {
    db.close()
  }
}

// Calculate the depth of a task in the dependency tree
export function calculateTaskDepth(taskId: string, memo = new Map<string, number>()): number {
  if (memo.has(taskId)) return memo.get(taskId)!

  const dependencies = getTaskDependencies(taskId)

  if (dependencies.length === 0) {
    memo.set(taskId, 0)
    return 0
  }

  const maxDepth = Math.max(...dependencies.map((depId) => calculateTaskDepth(depId, memo)))

  const depth = maxDepth + 1
  memo.set(taskId, depth)
  return depth
}
