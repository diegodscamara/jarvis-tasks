'use client'

import { useMemo } from 'react'

/**
 * Hook to check if a task is overdue.
 * Uses client-side initialization to avoid hydration mismatches.
 */
export function useIsOverdue(dueDate: string | null | undefined): boolean {
  const now = useMemo(() => new Date(), [])

  if (!dueDate) return false

  return new Date(dueDate) < now
}
