'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl)
    },
    [pathname, router, searchParams]
  )

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl)
    },
    [pathname, router, searchParams]
  )

  const getParam = useCallback(
    (key: string) => {
      return searchParams.get(key)
    },
    [searchParams]
  )

  const clearParams = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  return {
    setParam,
    setParams,
    getParam,
    clearParams,
    searchParams,
  }
}
