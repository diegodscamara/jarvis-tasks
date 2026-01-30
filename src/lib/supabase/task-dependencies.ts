import { createSupabaseServerClient } from './server'

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
export async function getTaskDependencies(taskId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('depends_on_id')
    .eq('task_id', taskId)

  if (error) throw error

  return data?.map((d) => d.depends_on_id) || []
}

// Get all tasks that depend on a specific task
export async function getTaskDependents(taskId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('task_id')
    .eq('depends_on_id', taskId)

  if (error) throw error

  return data?.map((d) => d.task_id) || []
}

// Add a dependency
export async function addTaskDependency(taskId: string, dependsOnId: string): Promise<boolean> {
  // First validate that this won't create a circular dependency
  const validation = await validateDependency(taskId, dependsOnId)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_id: dependsOnId })

  if (error) throw error
  return true
}

// Remove a dependency
export async function removeTaskDependency(taskId: string, dependsOnId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_id', dependsOnId)

  return !error
}

// Validate that adding a dependency won't create a cycle
export async function validateDependency(
  taskId: string,
  newDependsOnId: string
): Promise<DependencyValidation> {
  const supabase = await createSupabaseServerClient()

  // Get all dependencies
  const { data: allDependencies, error } = await supabase.from('task_dependencies').select('*')

  if (error) throw error

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
    const deps =
      allDependencies?.filter((d) => d.task_id === currentId).map((d) => d.depends_on_id) || []

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
}

// Check if a task can change status based on its dependencies
export async function canChangeTaskStatus(
  taskId: string,
  newStatus: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Moving backwards is always allowed
  if (['todo', 'backlog', 'planning'].includes(newStatus)) {
    return { allowed: true }
  }

  // For forward movement, check dependencies
  const dependencies = await getTaskDependencies(taskId)

  if (dependencies.length === 0) {
    return { allowed: true }
  }

  const supabase = await createSupabaseServerClient()

  // Check if all dependencies are complete
  const incompleteDeps: string[] = []

  for (const depId of dependencies) {
    const { data: dep } = await supabase
      .from('tasks')
      .select('id, status, title')
      .eq('id', depId)
      .single()

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
}

// Calculate the depth of a task in the dependency tree
export async function calculateTaskDepth(
  taskId: string,
  memo = new Map<string, number>()
): Promise<number> {
  if (memo.has(taskId)) return memo.get(taskId)!

  const dependencies = await getTaskDependencies(taskId)

  if (dependencies.length === 0) {
    memo.set(taskId, 0)
    return 0
  }

  const depths = await Promise.all(dependencies.map((depId) => calculateTaskDepth(depId, memo)))

  const maxDepth = Math.max(...depths)
  const depth = maxDepth + 1
  memo.set(taskId, depth)
  return depth
}
