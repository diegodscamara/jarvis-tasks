'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Label } from '@/types'

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/labels')
      if (!res.ok) throw new Error('Failed to fetch labels')
      const data = await res.json()
      setLabels(data.labels || [])
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  const createLabel = useCallback(
    async (label: Partial<Label>) => {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(label),
      })
      if (!res.ok) throw new Error('Failed to create label')
      await fetchLabels()
      return res.json()
    },
    [fetchLabels]
  )

  const updateLabel = useCallback(
    async (label: Partial<Label>) => {
      const res = await fetch('/api/labels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(label),
      })
      if (!res.ok) throw new Error('Failed to update label')
      await fetchLabels()
      return res.json()
    },
    [fetchLabels]
  )

  const deleteLabel = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/labels?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete label')
      await fetchLabels()
    },
    [fetchLabels]
  )

  // Group labels by their group property
  const labelGroups = labels.reduce(
    (acc, label) => {
      const group = label.group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(label)
      return acc
    },
    {} as Record<string, Label[]>
  )

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  return {
    labels,
    labelGroups,
    loading,
    error,
    refetch: fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
  }
}
