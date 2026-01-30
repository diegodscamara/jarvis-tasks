import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

export interface TaskLinkItem {
  id: string
  title: string
  status: string
}

export interface TaskLinksProps {
  query: string
  items: TaskLinkItem[]
}

export const TaskLinks = forwardRef<any, TaskLinksProps>(({ query, items }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (!item) return

    ;(window as any).__taskLinkItem = item
  }

  const upHandler = () => {
    setSelectedIndex((items.length + selectedIndex - 1) % items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-600 bg-green-50'
      case 'in-progress':
        return 'text-blue-600 bg-blue-50'
      case 'blocked':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="z-50 min-w-[300px] max-w-[400px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md">
      {items.length ? (
        items.map((item, index) => (
          <button
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
              index === selectedIndex && 'bg-accent'
            )}
            key={item.id}
            onClick={() => selectItem(index)}
          >
            <span className="flex-1 truncate">{item.title}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium',
                getStatusColor(item.status)
              )}
            >
              {item.status}
            </span>
          </button>
        ))
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No tasks found</div>
      )}
    </div>
  )
})

TaskLinks.displayName = 'TaskLinks'
