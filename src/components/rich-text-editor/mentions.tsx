import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { cn } from '@/lib/utils'
import { AGENTS } from '@/lib/constants'

export interface MentionItem {
  id: string
  name: string
  avatar?: string
}

export interface MentionsProps {
  query: string
  items: MentionItem[]
}

export const Mentions = forwardRef<any, MentionsProps>(
  ({ query, items }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (!item) return
      
      ;(window as any).__mentionItem = item
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

    return (
      <div className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md">
        {items.length ? (
          items.map((item, index) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                index === selectedIndex && 'bg-accent'
              )}
              key={item.id}
              onClick={() => selectItem(index)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {item.name.charAt(0).toUpperCase()}
              </span>
              <span>{item.name}</span>
            </button>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    )
  }
)

Mentions.displayName = 'Mentions'