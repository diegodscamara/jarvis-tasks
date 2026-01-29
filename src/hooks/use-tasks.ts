'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Task } from '@/types'

interface UseTasksOptions {
  autoFetch?: boolean
}

export function useTasks(options: UseTasksOptions = { autoFetch: true }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(
    async (task: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) throw new Error('Failed to create task')
      await fetchTasks()
      return res.json()
    },
    [fetchTasks]
  )

  const updateTask = useCallback(
    async (task: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) throw new Error('Failed to update task')
      await fetchTasks()
      return res.json()
    },
    [fetchTasks]
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      await fetchTasks()
    },
    [fetchTasks]
  )

  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: Task['status']) => {
      const promises = ids.map((id) =>
        fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      )
      await Promise.all(promises)
      await fetchTasks()
    },
    [fetchTasks]
  )

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      const promises = ids.map((id) => fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }))
      await Promise.all(promises)
      await fetchTasks()
    },
    [fetchTasks]
  )

  useEffect(() => {
    if (options.autoFetch) {
      fetchTasks()
    }
  }, [fetchTasks, options.autoFetch])

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateStatus,
    bulkDelete,
  }
}
