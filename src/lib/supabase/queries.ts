import { createSupabaseServerClient } from './server'
import type { Database } from './types'

type Project = Database['public']['Tables']['projects']['Row']
type Label = Database['public']['Tables']['labels']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Comment = Database['public']['Tables']['comments']['Row']
type _TaskLabel = Database['public']['Tables']['task_labels']['Row']

export interface TaskWithRelations extends Task {
  labelIds?: string[]
  comments?: Comment[]
  projectId?: string | null
  parentId?: string | null
  recurrenceType?: string | null
  timeSpent?: number | null
}

// Projects
export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('projects').select('*').order('name')

  if (error) throw error
  return data || []
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()

  if (error) return undefined
  return data
}

export async function createProject(
  project: Omit<Database['public']['Tables']['projects']['Insert'], 'created_at' | 'updated_at'>
): Promise<Project> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('projects').insert(project).select().single()

  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return undefined
  return data
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)

  return !error
}

// Labels
export async function getAllLabels(): Promise<Label[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('labels').select('*').order('group').order('name')

  if (error) throw error
  return data || []
}

export async function getLabelById(id: string): Promise<Label | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('labels').select('*').eq('id', id).single()

  if (error) return undefined
  return data
}

export async function createLabel(
  label: Omit<Database['public']['Tables']['labels']['Insert'], 'created_at'>
): Promise<Label> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('labels').insert(label).select().single()

  if (error) throw error
  return data
}

export async function updateLabel(id: string, updates: Partial<Label>): Promise<Label | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('labels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return undefined
  return data
}

export async function deleteLabel(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('labels').delete().eq('id', id)

  return !error
}

// Tasks
export async function getAllTasks(): Promise<TaskWithRelations[]> {
  const supabase = await createSupabaseServerClient()

  // Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('updated_at', { ascending: false })

  if (tasksError) throw tasksError
  if (!tasks) return []

  // Get all task labels
  const { data: taskLabels, error: labelsError } = await supabase.from('task_labels').select('*')

  if (labelsError) throw labelsError

  // Get all comments
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .order('created_at')

  if (commentsError) throw commentsError

  // Map tasks with their relations
  return tasks.map((task) => {
    const labelIds =
      taskLabels?.filter((tl) => tl.task_id === task.id).map((tl) => tl.label_id) || []

    const taskComments = comments?.filter((c) => c.task_id === task.id) || []

    return {
      ...task,
      projectId: task.project_id,
      parentId: task.parent_id,
      recurrenceType: task.recurrence_type,
      timeSpent: task.time_spent,
      labelIds,
      comments: taskComments.length > 0 ? taskComments : undefined,
    }
  })
}

export async function getTaskById(id: string): Promise<TaskWithRelations | undefined> {
  const supabase = await createSupabaseServerClient()

  // Get task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (taskError || !task) return undefined

  // Get labels for this task
  const { data: taskLabels } = await supabase
    .from('task_labels')
    .select('label_id')
    .eq('task_id', id)

  // Get comments for this task
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', id)
    .order('created_at')

  return {
    ...task,
    projectId: task.project_id,
    parentId: task.parent_id,
    recurrenceType: task.recurrence_type,
    timeSpent: task.time_spent,
    labelIds: taskLabels?.map((tl) => tl.label_id) || [],
    comments: comments && comments.length > 0 ? comments : undefined,
  }
}

export async function createTask(task: {
  id?: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
  assignee?: string
  projectId?: string
  labelIds?: string[]
  dueDate?: string
  estimate?: number
  parentId?: string
  recurrenceType?: string
}): Promise<TaskWithRelations> {
  const supabase = await createSupabaseServerClient()

  // Create the task
  const { data: newTask, error: taskError } = await supabase
    .from('tasks')
    .insert({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      assignee: task.assignee || 'jarvis',
      project_id: task.projectId || null,
      due_date: task.dueDate || null,
      estimate: task.estimate || null,
      parent_id: task.parentId || null,
      recurrence_type: task.recurrenceType || null,
    })
    .select()
    .single()

  if (taskError) throw taskError

  // Insert labels if any
  if (task.labelIds && task.labelIds.length > 0) {
    const labelInserts = task.labelIds.map((labelId) => ({
      task_id: newTask.id,
      label_id: labelId,
    }))

    const { error: labelError } = await supabase.from('task_labels').insert(labelInserts)

    if (labelError) throw labelError
  }

  const result = await getTaskById(newTask.id)
  if (!result) throw new Error('Failed to retrieve created task')
  return result
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    status: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
    assignee: string
    projectId: string | null
    labelIds: string[]
    dueDate: string | null
    estimate: number | null
    parentId: string | null
    timeSpent: number | null
  }>
): Promise<TaskWithRelations | undefined> {
  const supabase = await createSupabaseServerClient()

  const taskUpdates: any = {}
  if (updates.title !== undefined) taskUpdates.title = updates.title
  if (updates.description !== undefined) taskUpdates.description = updates.description
  if (updates.priority !== undefined) taskUpdates.priority = updates.priority
  if (updates.status !== undefined) taskUpdates.status = updates.status
  if (updates.assignee !== undefined) taskUpdates.assignee = updates.assignee
  if (updates.projectId !== undefined) taskUpdates.project_id = updates.projectId
  if (updates.dueDate !== undefined) taskUpdates.due_date = updates.dueDate
  if (updates.estimate !== undefined) taskUpdates.estimate = updates.estimate
  if (updates.parentId !== undefined) taskUpdates.parent_id = updates.parentId
  if (updates.timeSpent !== undefined) taskUpdates.time_spent = updates.timeSpent

  // Update task if there are task updates
  if (Object.keys(taskUpdates).length > 0) {
    const { error: updateError } = await supabase.from('tasks').update(taskUpdates).eq('id', id)

    if (updateError) throw updateError
  }

  // Update labels if provided
  if (updates.labelIds !== undefined) {
    // Delete existing labels
    await supabase.from('task_labels').delete().eq('task_id', id)

    // Insert new labels
    if (updates.labelIds.length > 0) {
      const labelInserts = updates.labelIds.map((labelId) => ({
        task_id: id,
        label_id: labelId,
      }))

      await supabase.from('task_labels').insert(labelInserts)
    }
  }

  return getTaskById(id)
}

export async function deleteTask(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  return !error
}

// Comments
export async function getCommentsForTask(taskId: string): Promise<Comment[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')

  if (error) throw error
  return data || []
}

export async function createComment(
  comment: Omit<Database['public']['Tables']['comments']['Insert'], 'created_at'>
): Promise<Comment> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('comments').insert(comment).select().single()

  if (error) throw error
  return data
}

export async function deleteComment(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('comments').delete().eq('id', id)

  return !error
}

// Task Links
type TaskLink = Database['public']['Tables']['task_links']['Row']

export async function getLinksForTask(taskId: string): Promise<TaskLink[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('task_links')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createLink(
  link: Omit<Database['public']['Tables']['task_links']['Insert'], 'created_at'>
): Promise<TaskLink> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('task_links').insert(link).select().single()

  if (error) throw error
  return data
}

export async function deleteLink(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('task_links').delete().eq('id', id)

  return !error
}

type Goal = Database['public']['Tables']['goals']['Row']
type GoalKeyResult = Database['public']['Tables']['goal_key_results']['Row']

export interface GoalWithKeyResults extends Goal {
  key_results: GoalKeyResult[]
}

export async function getAllGoals(): Promise<GoalWithKeyResults[]> {
  const supabase = await createSupabaseServerClient()
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .order('updated_at', { ascending: false })

  if (goalsError) throw goalsError
  if (!goals?.length) return []

  const { data: keyResults, error: krError } = await supabase
    .from('goal_key_results')
    .select('*')
    .order('position')
    .order('created_at')

  if (krError) throw krError

  return goals.map((goal) => ({
    ...goal,
    key_results: (keyResults ?? []).filter((kr) => kr.goal_id === goal.id),
  }))
}

export async function getGoalById(id: string): Promise<GoalWithKeyResults | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (goalError || !goal) return undefined

  const { data: keyResults } = await supabase
    .from('goal_key_results')
    .select('*')
    .eq('goal_id', id)
    .order('position')
    .order('created_at')

  return {
    ...goal,
    key_results: keyResults ?? [],
  }
}

export async function createGoal(
  goal: Omit<Database['public']['Tables']['goals']['Insert'], 'created_at' | 'updated_at'>
): Promise<Goal> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...goal, created_at: now, updated_at: now })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(
  id: string,
  updates: Partial<Pick<Goal, 'title' | 'description'>>
): Promise<Goal | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return undefined
  return data
}

export async function deleteGoal(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('goals').delete().eq('id', id)

  return !error
}

export async function getKeyResultsForGoal(goalId: string): Promise<GoalKeyResult[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('goal_key_results')
    .select('*')
    .eq('goal_id', goalId)
    .order('position')
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export async function createKeyResult(
  kr: Omit<Database['public']['Tables']['goal_key_results']['Insert'], 'created_at'>
): Promise<GoalKeyResult> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('goal_key_results').insert(kr).select().single()

  if (error) throw error
  return data
}

export async function updateKeyResult(
  id: string,
  updates: Partial<Pick<GoalKeyResult, 'title' | 'done' | 'position'>>
): Promise<GoalKeyResult | undefined> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('goal_key_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return undefined
  return data
}

export async function deleteKeyResult(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('goal_key_results').delete().eq('id', id)

  return !error
}

type Habit = Database['public']['Tables']['habits']['Row']
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']

export interface HabitWithCompletions extends Habit {
  streak: number
  completed_dates: string[]
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  let check = today
  for (const d of sorted) {
    if (d !== check) break
    streak++
    const next = new Date(check)
    next.setDate(next.getDate() - 1)
    check = next.toISOString().slice(0, 10)
  }
  return streak
}

export async function getAllHabitsWithCompletions(): Promise<HabitWithCompletions[]> {
  const supabase = await createSupabaseServerClient()
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true })

  if (habitsError) throw habitsError
  if (!habits?.length) return []

  const start = new Date()
  start.setDate(start.getDate() - 6)
  const startStr = start.toISOString().slice(0, 10)

  const { data: weekCompletions, error: compError } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_date')
    .gte('completed_date', startStr)

  if (compError) throw compError

  const habitIds = habits.map((h) => h.id)
  const { data: allCompletions, error: allError } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_date')
    .in('habit_id', habitIds)

  if (allError) throw allError

  const weekByHabit = new Map<string, string[]>()
  const allByHabit = new Map<string, string[]>()
  for (const c of weekCompletions ?? []) {
    const list = weekByHabit.get(c.habit_id) ?? []
    list.push(c.completed_date)
    weekByHabit.set(c.habit_id, list)
  }
  for (const c of allCompletions ?? []) {
    const list = allByHabit.get(c.habit_id) ?? []
    list.push(c.completed_date)
    allByHabit.set(c.habit_id, list)
  }

  return habits.map((h) => {
    const weekDates = (weekByHabit.get(h.id) ?? []).sort()
    const allDates = allByHabit.get(h.id) ?? []
    return {
      ...h,
      streak: computeStreak(allDates),
      completed_dates: weekDates,
    }
  })
}

export async function createHabit(
  habit: Omit<Database['public']['Tables']['habits']['Insert'], 'created_at'>
): Promise<Habit> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('habits').insert(habit).select().single()

  if (error) throw error
  return data
}

export async function deleteHabit(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('habits').delete().eq('id', id)

  return !error
}

export async function setHabitCompletion(habitId: string, date: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('habit_completions')
    .upsert({ habit_id: habitId, completed_date: date }, { onConflict: 'habit_id,completed_date' })
}

export async function removeHabitCompletion(habitId: string, date: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_date', date)

  return !error
}
