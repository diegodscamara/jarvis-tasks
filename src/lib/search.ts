import { addDays, endOfDay, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns'
import type { Priority, Status, Task } from '@/types'

export interface SearchFilters {
  query?: string
  status?: Status[]
  priority?: Priority[]
  assignee?: string[]
  projectId?: string[]
  labelIds?: string[]
  createdAfter?: Date
  createdBefore?: Date
  updatedAfter?: Date
  updatedBefore?: Date
  dueAfter?: Date
  dueBefore?: Date
  hasComments?: boolean
  hasAttachments?: boolean
  hasEstimate?: boolean
  isOverdue?: boolean
  parentId?: string | null
}

export interface SearchQuery {
  text: string
  filters: SearchFilters
}

export interface SavedSearch {
  id: string
  name: string
  query: SearchQuery
  createdAt: string
  usageCount: number
}

// Parse search query syntax
export function parseSearchQuery(query: string): SearchQuery {
  const filters: SearchFilters = {}
  let text = query

  // Extract quoted strings first to preserve them
  const quotedStrings: string[] = []
  text = text.replace(/"([^"]+)"/g, (match, p1) => {
    quotedStrings.push(p1)
    return `__QUOTED_${quotedStrings.length - 1}__`
  })

  // Parse operators
  const operatorRegex = /(\w+):([^\s]+)/g
  const matches = Array.from(text.matchAll(operatorRegex))

  for (const match of matches) {
    const [fullMatch, operator, value] = match
    text = text.replace(fullMatch, '')

    switch (operator) {
      case 'status':
        filters.status = filters.status || []
        filters.status.push(value as Status)
        break

      case 'priority':
        filters.priority = filters.priority || []
        filters.priority.push(value as Priority)
        break

      case 'assignee':
        filters.assignee = filters.assignee || []
        filters.assignee.push(value)
        break

      case 'project':
        filters.projectId = filters.projectId || []
        filters.projectId.push(value)
        break

      case 'label':
        filters.labelIds = filters.labelIds || []
        filters.labelIds.push(value)
        break

      case 'due': {
        const dueRange = parseDateRange(value)
        if (dueRange) {
          filters.dueAfter = dueRange.start
          filters.dueBefore = dueRange.end
        }
        break
      }

      case 'created': {
        const createdRange = parseDateRange(value)
        if (createdRange) {
          filters.createdAfter = createdRange.start
          filters.createdBefore = createdRange.end
        }
        break
      }

      case 'updated': {
        const updatedRange = parseDateRange(value)
        if (updatedRange) {
          filters.updatedAfter = updatedRange.start
          filters.updatedBefore = updatedRange.end
        }
        break
      }

      case 'has':
        switch (value) {
          case 'comments':
            filters.hasComments = true
            break
          case 'attachments':
            filters.hasAttachments = true
            break
          case 'estimate':
            filters.hasEstimate = true
            break
        }
        break

      case 'is':
        if (value === 'overdue') {
          filters.isOverdue = true
        }
        break
    }
  }

  // Restore quoted strings
  text = text.replace(/__QUOTED_(\d+)__/g, (match, index) => {
    return quotedStrings[parseInt(index)]
  })

  return {
    text: text.trim(),
    filters,
  }
}

// Parse date range expressions
function parseDateRange(value: string): { start: Date; end: Date } | null {
  // Handle range syntax: 2024-01-15..2024-01-20
  if (value.includes('..')) {
    const [startStr, endStr] = value.split('..')
    try {
      return {
        start: parseISO(startStr),
        end: parseISO(endStr),
      }
    } catch {
      return null
    }
  }

  // Handle relative dates
  const today = new Date()

  switch (value) {
    case 'today':
      return {
        start: startOfDay(today),
        end: endOfDay(today),
      }

    case 'tomorrow': {
      const tomorrow = addDays(today, 1)
      return {
        start: startOfDay(tomorrow),
        end: endOfDay(tomorrow),
      }
    }

    case 'yesterday': {
      const yesterday = subDays(today, 1)
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      }
    }

    case 'week':
    case 'this-week':
      return {
        start: startOfDay(subDays(today, 7)),
        end: endOfDay(today),
      }

    case 'month':
    case 'this-month':
      return {
        start: startOfDay(subDays(today, 30)),
        end: endOfDay(today),
      }

    default:
      // Try to parse as absolute date
      try {
        const date = parseISO(value)
        return {
          start: startOfDay(date),
          end: endOfDay(date),
        }
      } catch {
        return null
      }
  }
}

// Apply filters to tasks
export function filterTasks(tasks: Task[], filters: SearchFilters): Task[] {
  return tasks.filter((task) => {
    // Text search
    if (filters.query) {
      const searchText = filters.query.toLowerCase()
      const taskText = (
        task.title +
        ' ' +
        (task.description || '') +
        ' ' +
        (task.comments?.map((c) => c.content || c.text || '').join(' ') || '')
      ).toLowerCase()

      if (!taskText.includes(searchText)) {
        return false
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) {
        return false
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) {
        return false
      }
    }

    // Assignee filter
    if (filters.assignee && filters.assignee.length > 0) {
      if (!filters.assignee.includes(task.assignee)) {
        return false
      }
    }

    // Project filter
    if (filters.projectId && filters.projectId.length > 0) {
      if (!task.projectId || !filters.projectId.includes(task.projectId)) {
        return false
      }
    }

    // Label filter
    if (filters.labelIds && filters.labelIds.length > 0) {
      if (!task.labelIds || !filters.labelIds.some((id) => task.labelIds!.includes(id))) {
        return false
      }
    }

    // Date filters
    const taskCreated = parseISO(task.createdAt)
    const taskUpdated = parseISO(task.updatedAt)

    if (filters.createdAfter && taskCreated < filters.createdAfter) {
      return false
    }
    if (filters.createdBefore && taskCreated > filters.createdBefore) {
      return false
    }

    if (filters.updatedAfter && taskUpdated < filters.updatedAfter) {
      return false
    }
    if (filters.updatedBefore && taskUpdated > filters.updatedBefore) {
      return false
    }

    // Due date filters
    if (task.dueDate) {
      const taskDue = parseISO(task.dueDate)
      if (filters.dueAfter && taskDue < filters.dueAfter) {
        return false
      }
      if (filters.dueBefore && taskDue > filters.dueBefore) {
        return false
      }
    } else if (filters.dueAfter || filters.dueBefore) {
      // Task has no due date but filter requires one
      return false
    }

    // Has filters
    if (filters.hasComments && (!task.comments || task.comments.length === 0)) {
      return false
    }

    if (filters.hasEstimate && !task.estimate) {
      return false
    }

    // Is overdue
    if (filters.isOverdue) {
      if (!task.dueDate || task.status === 'done') {
        return false
      }
      const now = new Date()
      const due = parseISO(task.dueDate)
      if (due >= now) {
        return false
      }
    }

    return true
  })
}

// Score and rank search results
export function rankSearchResults(tasks: Task[], query: string): Task[] {
  if (!query) return tasks

  const searchTerms = query.toLowerCase().split(/\s+/)

  const scoredTasks = tasks.map((task) => {
    let score = 0
    const title = task.title.toLowerCase()
    const description = (task.description || '').toLowerCase()

    for (const term of searchTerms) {
      // Exact title match scores highest
      if (title === term) {
        score += 100
      }
      // Title contains term
      else if (title.includes(term)) {
        score += 50
        // Bonus if term is at the beginning
        if (title.startsWith(term)) {
          score += 25
        }
      }

      // Description contains term
      if (description.includes(term)) {
        score += 20
      }

      // Comments contain term
      if (task.comments) {
        for (const comment of task.comments) {
          const commentText = (comment.content || comment.text || '').toLowerCase()
          if (commentText.includes(term)) {
            score += 10
          }
        }
      }
    }

    // Boost recent tasks slightly
    const daysSinceUpdate =
      (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate < 7) {
      score += 5
    }

    // Boost high priority tasks
    if (task.priority === 'high') {
      score += 3
    }

    return { task, score }
  })

  // Sort by score descending
  return scoredTasks.sort((a, b) => b.score - a.score).map(({ task }) => task)
}

// Highlight search terms in text
export function highlightSearchTerms(text: string, query: string): string {
  if (!query) return text

  const terms = query.split(/\s+/).filter((term) => term.length > 0)
  let highlighted = text

  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark>$1</mark>')
  }

  return highlighted
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Get search suggestions based on existing data
export function getSearchSuggestions(
  query: string,
  tasks: Task[],
  projects: Array<{ id: string; name: string }>,
  labels: Array<{ id: string; name: string }>
): string[] {
  const suggestions: string[] = []
  const lowercaseQuery = query.toLowerCase()

  // Suggest operators
  const operators = [
    'status:',
    'priority:',
    'assignee:',
    'project:',
    'label:',
    'due:',
    'has:',
    'is:',
  ]
  for (const op of operators) {
    if (op.startsWith(lowercaseQuery) && !query.includes(':')) {
      suggestions.push(op)
    }
  }

  // If typing after an operator
  if (query.includes(':')) {
    const [operator, value] = query.split(':')
    const partialValue = value.toLowerCase()

    switch (operator) {
      case 'status': {
        const statuses: Status[] = ['backlog', 'planning', 'todo', 'in_progress', 'review', 'done']
        suggestions.push(
          ...statuses.filter((s) => s.startsWith(partialValue)).map((s) => `${operator}:${s}`)
        )
        break
      }

      case 'priority': {
        const priorities: Priority[] = ['high', 'medium', 'low']
        suggestions.push(
          ...priorities.filter((p) => p.startsWith(partialValue)).map((p) => `${operator}:${p}`)
        )
        break
      }

      case 'assignee': {
        const assignees = [...new Set(tasks.map((t) => t.assignee))]
        suggestions.push(
          ...assignees
            .filter((a) => a.toLowerCase().startsWith(partialValue))
            .map((a) => `${operator}:${a}`)
        )
        break
      }

      case 'project':
        suggestions.push(
          ...projects
            .filter((p) => p.name.toLowerCase().startsWith(partialValue))
            .map((p) => `${operator}:${p.id}`)
        )
        break

      case 'label':
        suggestions.push(
          ...labels
            .filter((l) => l.name.toLowerCase().startsWith(partialValue))
            .map((l) => `${operator}:${l.id}`)
        )
        break

      case 'due': {
        const dueDates = ['today', 'tomorrow', 'week', 'month']
        suggestions.push(
          ...dueDates.filter((d) => d.startsWith(partialValue)).map((d) => `${operator}:${d}`)
        )
        break
      }

      case 'has': {
        const hasOptions = ['comments', 'attachments', 'estimate']
        suggestions.push(
          ...hasOptions.filter((h) => h.startsWith(partialValue)).map((h) => `${operator}:${h}`)
        )
        break
      }

      case 'is': {
        const isOptions = ['overdue']
        suggestions.push(
          ...isOptions.filter((i) => i.startsWith(partialValue)).map((i) => `${operator}:${i}`)
        )
        break
      }
    }
  }

  // Limit suggestions
  return suggestions.slice(0, 10)
}
