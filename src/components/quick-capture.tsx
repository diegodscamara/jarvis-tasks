'use client'

import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { parseQuickCaptureInput } from '@/lib/quick-capture-parse'
import type { Priority, Task } from '@/types'

interface QuickCaptureProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (task: Task) => void
  defaultAssignee?: string
}

export function QuickCapture({
  isOpen,
  onClose,
  onTaskCreated,
  defaultAssignee = 'jarvis',
}: QuickCaptureProps) {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => (input.trim() ? parseQuickCaptureInput(input) : null), [input])

  useEffect(() => {
    if (!isOpen) {
      setInput('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const { title, priority, dueDate } = parseQuickCaptureInput(trimmed)
    if (!title) return

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: '',
          priority,
          status: 'todo',
          assignee: defaultAssignee,
          dueDate: dueDate ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create task')
        return
      }
      const task = data as Task
      onTaskCreated?.(task)
      setInput('')
      onClose()
    } catch (e) {
      setError('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }, [input, defaultAssignee, onTaskCreated, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && isOpen) {
        const target = e.target as HTMLElement
        if (target.getAttribute('data-quick-capture-input') === 'true') {
          e.preventDefault()
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleSubmit])

  const priorityLabel = (p: Priority) => (p === 'high' ? 'High' : p === 'low' ? 'Low' : 'Medium')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Input
            data-quick-capture-input
            placeholder="e.g. Review PR tomorrow, urgent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            autoFocus
            className="text-base"
            disabled={isSubmitting}
            aria-label="Quick capture task input"
          />

          {parsed && parsed.title && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {parsed.priority !== 'medium' && (
                <span
                  className={`rounded px-2 py-0.5 ${
                    parsed.priority === 'high'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {priorityLabel(parsed.priority)} priority
                </span>
              )}
              {parsed.dueDate && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                  Due {parsed.dueDate}
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Press{' '}
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to
              save · <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">n</kbd>{' '}
              to open
            </p>
            <Button onClick={handleSubmit} disabled={!input.trim() || isSubmitting}>
              <Plus className="mr-1 h-4 w-4" />
              Add task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
