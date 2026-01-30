import { addDays } from 'date-fns'
import type { Priority, Status, Task } from '@/types'

interface ParsedCommand {
  action: 'create' | 'update' | 'query' | 'delete'
  task?: Partial<Task>
  taskId?: string
  updates?: Partial<Task>
  filters?: {
    priority?: Priority
    status?: Status
    assignee?: string
    dueRange?: string
    search?: string
  }
}

interface Suggestions {
  breakdown?: Array<{ title: string; description?: string }>
  similar?: Task[]
  dependencies?: string[]
  labels?: string[]
  priority?: Priority
  estimate?: number
}

interface AICommandResult {
  success: boolean
  action?: string
  task?: Partial<Task>
  tasks?: Task[]
  error?: string
  message?: string
}

// Natural Language Processing
export function parseNaturalLanguage(input: string): ParsedCommand {
  const normalizedInput = input.toLowerCase().trim()

  // Detect action
  if (
    normalizedInput.includes('create') ||
    normalizedInput.includes('add') ||
    normalizedInput.includes(':') ||
    !normalizedInput.includes('task')
  ) {
    return parseCreateCommand(input)
  } else if (
    normalizedInput.includes('mark') ||
    normalizedInput.includes('update') ||
    normalizedInput.includes('change') ||
    normalizedInput.includes('set')
  ) {
    return parseUpdateCommand(input)
  } else if (
    normalizedInput.includes('show') ||
    normalizedInput.includes('list') ||
    normalizedInput.includes('find') ||
    normalizedInput.includes('get')
  ) {
    return parseQueryCommand(input)
  } else if (normalizedInput.includes('delete') || normalizedInput.includes('remove')) {
    return parseDeleteCommand(input)
  }

  // Default to create if unclear
  return parseCreateCommand(input)
}

function parseCreateCommand(input: string): ParsedCommand {
  const task: Partial<Task> = {}

  // Extract priority
  const priorityMatch = input.match(/\b(high|medium|low)\s*priority\b/i)
  if (priorityMatch) {
    task.priority = priorityMatch[1].toLowerCase() as Priority
    input = input.replace(priorityMatch[0], '').trim()
  }

  // Extract due date
  const tomorrow = /\btomorrow\b/i.test(input)
  const timeMatch = input.match(/at\s+(\d{1,2})\s*(am|pm)?/i)

  if (tomorrow) {
    const date = addDays(new Date(), 1)
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10)
      if (timeMatch[2]?.toLowerCase() === 'pm' && hour < 12) hour += 12
      date.setHours(hour, 0, 0, 0)
    }
    task.dueDate = date.toISOString()
    input = input.replace(/\btomorrow\b/i, '').replace(timeMatch?.[0] || '', '')
  }

  // Extract assignee
  const assigneeMatch = input.match(/assign(?:ed)?\s+to\s+(\w+)/i)
  if (assigneeMatch) {
    task.assignee = assigneeMatch[1].toLowerCase() as any
    input = input.replace(assigneeMatch[0], '')
  }

  // Clean up title
  let title = input
    .replace(/^(create|add)\s+(a\s+)?task\s+(to\s+)?/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, (l) => l.toUpperCase())

  if (title) {
    task.title = title
  }

  // Set defaults
  task.status = 'todo'
  task.priority = task.priority || 'medium'

  return {
    action: 'create',
    task,
  }
}

function parseUpdateCommand(input: string): ParsedCommand {
  const taskIdMatch = input.match(/task[- ](\w+)/i)
  const taskId = taskIdMatch ? `task-${taskIdMatch[1]}` : undefined

  const updates: Partial<Task> = {}

  // Check for status updates
  if (/\b(done|complete|finished)\b/i.test(input)) {
    updates.status = 'done'
  } else if (/\bin\s*progress\b/i.test(input)) {
    updates.status = 'in_progress'
  } else if (/\btodo\b/i.test(input)) {
    updates.status = 'todo'
  }

  // Check for priority updates
  const priorityMatch = input.match(/\b(high|medium|low)\s*priority\b/i)
  if (priorityMatch) {
    updates.priority = priorityMatch[1].toLowerCase() as Priority
  }

  return {
    action: 'update',
    taskId,
    updates,
  }
}

function parseQueryCommand(input: string): ParsedCommand {
  const filters: ParsedCommand['filters'] = {}

  // Extract priority filter
  const priorityMatch = input.match(/\b(high|medium|low)\s*priority\b/i)
  if (priorityMatch) {
    filters.priority = priorityMatch[1].toLowerCase() as Priority
  }

  // Extract assignee filter
  const assigneeMatch = input.match(/assigned\s+to\s+(\w+)/i)
  if (assigneeMatch) {
    filters.assignee = assigneeMatch[1].toLowerCase()
  }

  // Extract due date range
  if (/\bthis\s+week\b/i.test(input)) {
    filters.dueRange = 'this_week'
  } else if (/\btoday\b/i.test(input)) {
    filters.dueRange = 'today'
  } else if (/\btomorrow\b/i.test(input)) {
    filters.dueRange = 'tomorrow'
  } else if (/\boverdue\b/i.test(input)) {
    filters.dueRange = 'overdue'
  }

  // Extract status filter
  if (/\bcompleted?\b/i.test(input) || /\bdone\b/i.test(input)) {
    filters.status = 'done'
  } else if (/\bin\s*progress\b/i.test(input)) {
    filters.status = 'in_progress'
  }

  return {
    action: 'query',
    filters,
  }
}

function parseDeleteCommand(input: string): ParsedCommand {
  const taskIdMatch = input.match(/task[- ](\w+)/i)
  const taskId = taskIdMatch ? `task-${taskIdMatch[1]}` : undefined

  return {
    action: 'delete',
    taskId,
  }
}

// AI Suggestions Engine
export function generateSuggestions(newTask: Partial<Task>, existingTasks: Task[]): Suggestions {
  const suggestions: Suggestions = {}

  // Task breakdown for complex tasks
  if (newTask.title && isComplexTask(newTask.title)) {
    suggestions.breakdown = generateTaskBreakdown(newTask.title, newTask.description)
  }

  // Find similar completed tasks
  if (newTask.title || newTask.description) {
    suggestions.similar = findSimilarTasks(newTask, existingTasks)
  }

  // Suggest dependencies
  suggestions.dependencies = suggestDependencies(newTask, existingTasks)

  // Auto-categorization
  suggestions.labels = suggestLabels(newTask)

  // Priority suggestion
  if (!newTask.priority) {
    suggestions.priority = suggestPriority(newTask)
  }

  // Time estimate
  suggestions.estimate = estimateTaskTime(newTask)

  return suggestions
}

function isComplexTask(title: string): boolean {
  const complexKeywords = [
    'build',
    'create',
    'develop',
    'implement',
    'design',
    'complete',
    'full',
    'entire',
    'platform',
    'system',
  ]
  const titleLower = title.toLowerCase()
  return complexKeywords.some((keyword) => titleLower.includes(keyword))
}

function generateTaskBreakdown(
  title: string,
  _description?: string
): Array<{ title: string; description?: string }> {
  const titleLower = title.toLowerCase()
  const breakdown = []

  if (titleLower.includes('e-commerce') || titleLower.includes('online store')) {
    breakdown.push(
      { title: 'Setup product catalog', description: 'Create product models and database schema' },
      {
        title: 'Implement shopping cart',
        description: 'Add cart functionality with session management',
      },
      {
        title: 'Create checkout flow',
        description: 'Build payment integration and order processing',
      },
      { title: 'Add user accounts', description: 'Implement customer registration and login' },
      {
        title: 'Build admin dashboard',
        description: 'Create product and order management interface',
      }
    )
  } else if (titleLower.includes('authentication') || titleLower.includes('auth')) {
    breakdown.push(
      { title: 'Setup user model', description: 'Create database schema for users' },
      { title: 'Implement registration', description: 'Build signup flow with validation' },
      { title: 'Add login functionality', description: 'Create login with session management' },
      { title: 'Add password reset', description: 'Implement forgot password flow' }
    )
  } else if (titleLower.includes('api')) {
    breakdown.push(
      { title: 'Design API endpoints', description: 'Plan RESTful routes and resources' },
      { title: 'Setup authentication', description: 'Implement API key or JWT auth' },
      {
        title: 'Create CRUD operations',
        description: 'Build create, read, update, delete endpoints',
      },
      { title: 'Add validation', description: 'Implement request validation and error handling' },
      { title: 'Write API documentation', description: 'Document endpoints with examples' }
    )
  } else {
    // Generic breakdown for complex tasks
    breakdown.push(
      { title: 'Research and planning', description: 'Gather requirements and create design' },
      { title: 'Setup project structure', description: 'Initialize repository and dependencies' },
      { title: 'Implement core features', description: 'Build main functionality' },
      { title: 'Add tests', description: 'Write unit and integration tests' },
      { title: 'Documentation', description: 'Create user and developer documentation' }
    )
  }

  return breakdown
}

function findSimilarTasks(newTask: Partial<Task>, existingTasks: Task[]): Task[] {
  const keywords = extractKeywords(`${newTask.title} ${newTask.description || ''}`)

  return existingTasks
    .filter((task) => task.status === 'done')
    .map((task) => ({
      task,
      score: calculateSimilarity(
        keywords,
        extractKeywords(`${task.title} ${task.description || ''}`)
      ),
    }))
    .filter(({ score }) => score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ task }) => task)
}

function extractKeywords(text: string): string[] {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'with',
    'as',
    'by',
  ]
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
}

function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1)
  const set2 = new Set(keywords2)
  const intersection = [...set1].filter((x) => set2.has(x))
  const union = new Set([...set1, ...set2])

  return intersection.length / union.size
}

function suggestDependencies(newTask: Partial<Task>, existingTasks: Task[]): string[] {
  const dependencies: string[] = []
  const titleLower = (newTask.title || '').toLowerCase()

  // Look for tasks that should be completed before this one
  existingTasks.forEach((task) => {
    if (task.status === 'done') return

    const taskTitleLower = task.title.toLowerCase()

    // Deployment depends on testing
    if (titleLower.includes('deploy') && taskTitleLower.includes('test')) {
      dependencies.push(task.id)
    }
    // Testing depends on implementation
    else if (titleLower.includes('test') && taskTitleLower.includes('implement')) {
      dependencies.push(task.id)
    }
    // Documentation depends on implementation
    else if (titleLower.includes('document') && taskTitleLower.includes('implement')) {
      dependencies.push(task.id)
    }
    // Production depends on staging
    else if (titleLower.includes('production') && taskTitleLower.includes('staging')) {
      dependencies.push(task.id)
    }
    // Look for explicitly mentioned dependencies
    else if (newTask.description?.includes(task.title)) {
      dependencies.push(task.id)
    }
  })

  return [...new Set(dependencies)]
}

function suggestLabels(task: Partial<Task>): string[] {
  const labels: string[] = []
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase()

  // Technology labels
  if (text.match(/\b(react|vue|angular|frontend)\b/)) labels.push('frontend')
  if (text.match(/\b(node|express|django|backend|api)\b/)) labels.push('backend')
  if (text.match(/\b(database|sql|mongo|redis)\b/)) labels.push('database')
  if (text.match(/\b(deploy|docker|aws|cloud)\b/)) labels.push('devops')

  // Feature labels
  if (text.match(/\b(bug|fix|error|issue)\b/)) labels.push('bug')
  if (text.match(/\b(feature|new|add|implement)\b/)) labels.push('feature')
  if (text.match(/\b(refactor|optimize|improve)\b/)) labels.push('enhancement')
  if (text.match(/\b(document|docs|readme)\b/)) labels.push('documentation')

  return labels
}

function suggestPriority(task: Partial<Task>): Priority {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase()

  // High priority indicators
  if (text.match(/\b(urgent|asap|critical|blocker|security|vulnerability)\b/)) {
    return 'high'
  }

  // Low priority indicators
  if (text.match(/\b(nice.to.have|optional|future|someday|cleanup)\b/)) {
    return 'low'
  }

  // Default to medium
  return 'medium'
}

function estimateTaskTime(task: Partial<Task>): number {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase()

  // Large tasks
  if (text.match(/\b(build|create|develop|implement).*(system|platform|application)\b/)) {
    return 40 // hours
  }

  // Medium tasks
  if (text.match(/\b(feature|module|component|integration)\b/)) {
    return 8
  }

  // Small tasks
  if (text.match(/\b(fix|update|change|modify)\b/)) {
    return 2
  }

  // Default
  return 4
}

// Clawdbot Integration
export async function processAICommand(payload: {
  message: string
  userId: string
  channel: string
  metadata?: any
}): Promise<AICommandResult> {
  try {
    // Remove wake words if present
    const message = payload.message
      .replace(/^(hey\s+)?jarvis[,\s]*/i, '')
      .replace(/^\/task\s+/i, '')
      .trim()

    // Parse the command
    const parsed = parseNaturalLanguage(message)

    switch (parsed.action) {
      case 'create':
        if (!parsed.task?.title) {
          return { success: false, error: 'Could not understand task title' }
        }

        // Add default assignee based on user
        parsed.task.assignee = parsed.task.assignee || 'jarvis'

        // Here you would call your task creation API
        // For now, we'll simulate success
        return {
          success: true,
          action: 'created',
          task: parsed.task,
          message: `Task "${parsed.task.title}" created successfully!`,
        }

      case 'update':
        if (!parsed.taskId) {
          return { success: false, error: 'Task ID not specified' }
        }

        return {
          success: true,
          action: 'updated',
          task: { id: parsed.taskId, ...parsed.updates },
          message: `Task ${parsed.taskId} updated`,
        }

      case 'query':
        // Here you would apply filters and fetch tasks
        return {
          success: true,
          action: 'queried',
          tasks: [], // Would be populated with actual results
          message: 'Query executed',
        }

      case 'delete':
        if (!parsed.taskId) {
          return { success: false, error: 'Task ID not specified' }
        }

        return {
          success: true,
          action: 'deleted',
          message: `Task ${parsed.taskId} deleted`,
        }

      default:
        return { success: false, error: 'Command not understood' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
