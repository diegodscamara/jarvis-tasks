import type { Editor } from '@tiptap/react'
import type React from 'react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SlashCommandItem {
  title: string
  command: string
  description: string
  icon: React.ReactNode
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    command: '/h1',
    description: 'Large heading',
    icon: <span className="font-bold text-base">H1</span>,
  },
  {
    title: 'Heading 2',
    command: '/h2',
    description: 'Medium heading',
    icon: <span className="font-bold text-base">H2</span>,
  },
  {
    title: 'Heading 3',
    command: '/h3',
    description: 'Small heading',
    icon: <span className="font-bold text-base">H3</span>,
  },
  {
    title: 'Bullet List',
    command: '/bullet',
    description: 'Create a bullet list',
    icon: <span>•</span>,
  },
  {
    title: 'Numbered List',
    command: '/numbered',
    description: 'Create a numbered list',
    icon: <span>1.</span>,
  },
  {
    title: 'Task List',
    command: '/task',
    description: 'Create a task list',
    icon: <span>☐</span>,
  },
  {
    title: 'Code Block',
    command: '/code',
    description: 'Add a code block',
    icon: <span className="font-mono text-xs">{'{ }'}</span>,
  },
  {
    title: 'Quote',
    command: '/quote',
    description: 'Add a quote',
    icon: <span>"</span>,
  },
  {
    title: 'Divider',
    command: '/divider',
    description: 'Add a horizontal divider',
    icon: <span>—</span>,
  },
]

export interface SlashCommandsProps {
  editor: Editor
  query: string
  items: SlashCommandItem[]
}

export const SlashCommands = forwardRef<any, SlashCommandsProps>(({ query, items }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (!item) return // You'll implement the actual command execution in the parent
    ;(window as any).__slashCommand = item
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
            key={item.command}
            onClick={() => selectItem(index)}
          >
            <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">
              {item.icon}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </div>
          </button>
        ))
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
      )}
    </div>
  )
})

SlashCommands.displayName = 'SlashCommands'
