'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(
    async (project: Partial<Project>) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (!res.ok) throw new Error('Failed to create project')
      await fetchProjects()
      return res.json()
    },
    [fetchProjects]
  )

  const updateProject = useCallback(
    async (project: Partial<Project>) => {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (!res.ok) throw new Error('Failed to update project')
      await fetchProjects()
      return res.json()
    },
    [fetchProjects]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
      await fetchProjects()
    },
    [fetchProjects]
  )

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}
