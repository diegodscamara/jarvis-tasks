'use client'

import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Task } from '@/types'

interface QuickCaptureButtonProps {
  onTaskCreated?: (task: Task) => void
}

export function QuickCaptureButton({ onTaskCreated }: QuickCaptureButtonProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'n') return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable]')) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!open) setInput('')
  }, [open])

  const handleSubmit = useCallback(async () => {
    const title = input.trim()
    if (!title) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: '',
          priority: 'medium',
          status: 'todo',
          assignee: 'jarvis',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create task')
      onTaskCreated?.(data as Task)
      setInput('')
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [input, onTaskCreated])

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Quick capture task (n)"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick capture</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-4 pt-2"
          >
            <Input
              placeholder="Task title"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              aria-label="Task title"
            />
            <Button type="submit" disabled={!input.trim() || isSubmitting} className="w-full">
              Add task
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
