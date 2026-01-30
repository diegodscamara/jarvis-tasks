import { createSupabaseServerClient } from './server'
import type { Database } from './types'

type Project = Database['public']['Tables']['projects']['Row']
type Label = Database['public']['Tables']['labels']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Comment = Database['public']['Tables']['comments']['Row']
type TaskLabel = Database['public']['Tables']['task_labels']['Row']

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
