import { eq, desc } from 'drizzle-orm'
import { db } from './index'
import { projects, tasks, labels, taskLabels, links, comments, type NewProject, type NewTask, type NewLabel, type NewComment } from './schema'

// Projects
export async function getAllProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt))
}

export async function getProject(id: string) {
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  return result[0]
}

export async function createProject(project: NewProject) {
  const result = await db.insert(projects).values(project).returning()
  return result[0]
}

export async function updateProject(id: string, updates: Partial<NewProject>) {
  const result = await db
    .update(projects)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(projects.id, id))
    .returning()
  return result[0]
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id))
  return { success: true }
}

// Tasks
export async function getAllTasks() {
  return db.select().from(tasks).orderBy(desc(tasks.createdAt))
}

export async function getTasksWithDetails() {
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt))
  
  // Get labels for all tasks
  const taskIds = allTasks.map(t => t.id)
  if (taskIds.length > 0) {
    const taskLabelsData = await db
      .select({
        taskId: taskLabels.taskId,
        label: labels
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, taskIds[0])) // This needs to be improved for multiple tasks
    
    // Group labels by task
    const labelsByTask = taskLabelsData.reduce((acc, item) => {
      if (!acc[item.taskId]) acc[item.taskId] = []
      acc[item.taskId].push(item.label)
      return acc
    }, {} as Record<string, typeof labels.$inferSelect[]>)
    
    // Attach labels to tasks
    return allTasks.map(task => ({
      ...task,
      labels: labelsByTask[task.id] || []
    }))
  }
  
  return allTasks.map(task => ({ ...task, labels: [] }))
}

export async function getTask(id: string) {
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  return result[0]
}

// Alias for backward compatibility
export const getTaskById = getTask

export async function getTaskById(id: string) {
  return getTask(id)
}

export async function createTask(task: NewTask) {
  const result = await db.insert(tasks).values(task).returning()
  return result[0]
}

export async function updateTask(id: string, updates: Partial<NewTask>) {
  const result = await db
    .update(tasks)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id))
    .returning()
  return result[0]
}

export async function deleteTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id))
  return { success: true }
}

// Labels
export async function getAllLabels() {
  return db.select().from(labels).orderBy(labels.name)
}

export async function createLabel(label: NewLabel) {
  const result = await db.insert(labels).values(label).returning()
  return result[0]
}

export async function updateLabel(id: string, updates: Partial<NewLabel>) {
  const result = await db
    .update(labels)
    .set(updates)
    .where(eq(labels.id, id))
    .returning()
  return result[0]
}

export async function deleteLabel(id: string) {
  await db.delete(labels).where(eq(labels.id, id))
  return { success: true }
}

// Task Labels
export async function addTaskLabel(taskId: string, labelId: string) {
  await db.insert(taskLabels).values({ taskId, labelId })
}

export async function removeTaskLabel(taskId: string, labelId: string) {
  await db
    .delete(taskLabels)
    .where(eq(taskLabels.taskId, taskId) && eq(taskLabels.labelId, labelId))
}

// Links
export async function getTaskLinks(taskId: string) {
  return db.select().from(links).where(eq(links.taskId, taskId))
}

export async function addTaskLink(link: { taskId: string; url: string; title?: string; type: string }) {
  const id = `link-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const result = await db.insert(links).values({ id, ...link }).returning()
  return result[0]
}

export async function removeTaskLink(id: string) {
  await db.delete(links).where(eq(links.id, id))
}

// Comments
export async function getTaskComments(taskId: string) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.taskId, taskId))
    .orderBy(desc(comments.createdAt))
}

export async function getCommentsForTask(taskId: string) {
  return getTaskComments(taskId)
}

export async function addTaskComment(comment: NewComment) {
  const result = await db.insert(comments).values(comment).returning()
  return result[0]
}

export async function createComment(comment: any) {
  const result = await db.insert(comments).values({
    id: comment.id,
    taskId: comment.task_id,
    author: comment.author,
    content: comment.content,
  }).returning()
  return result[0]
}

export async function deleteComment(id: string) {
  const result = await db.delete(comments).where(eq(comments.id, id)).returning()
  return result[0]
}