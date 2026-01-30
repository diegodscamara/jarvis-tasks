'use client'

import { Target } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface KeyResult {
  id: string
  goal_id: string
  title: string
  done: boolean
  position: number
  created_at: string
}

interface Goal {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  key_results: KeyResult[]
}

function progressForGoal(goal: Goal): number {
  const krs = goal.key_results ?? []
  if (krs.length === 0) return 0
  const done = krs.filter((kr) => kr.done).length
  return Math.round((done / krs.length) * 100)
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [newKrTitle, setNewKrTitle] = useState<Record<string, string>>({})

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.goals ?? [])
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const openCreate = () => {
    setEditingGoal(null)
    setFormTitle('')
    setFormDescription('')
    setDialogOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormTitle(goal.title)
    setFormDescription(goal.description ?? '')
    setDialogOpen(true)
  }

  const saveGoal = async () => {
    const title = formTitle.trim()
    if (!title) return
    try {
      if (editingGoal) {
        await fetch('/api/goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingGoal.id,
            title,
            description: formDescription.trim(),
          }),
        })
      } else {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description: formDescription.trim() }),
        })
      }
      setDialogOpen(false)
      fetchGoals()
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal and all its key results?')) return
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
      fetchGoals()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const addKeyResult = async (goalId: string) => {
    const title = (newKrTitle[goalId] ?? '').trim()
    if (!title) return
    try {
      await fetch(`/api/goals/${goalId}/key-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      setNewKrTitle((prev) => ({ ...prev, [goalId]: '' }))
      fetchGoals()
    } catch (error) {
      console.error('Failed to add key result:', error)
    }
  }

  const toggleKeyResult = async (kr: KeyResult) => {
    try {
      await fetch(`/api/goals/key-results/${kr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !kr.done }),
      })
      fetchGoals()
    } catch (error) {
      console.error('Failed to toggle key result:', error)
    }
  }

  const deleteKeyResult = async (krId: string) => {
    try {
      await fetch(`/api/goals/key-results/${krId}`, { method: 'DELETE' })
      fetchGoals()
    } catch (error) {
      console.error('Failed to delete key result:', error)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back to board"
          >
            ←
          </Link>
          <Target className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Goals</h1>
        </div>
        <Button size="sm" onClick={openCreate}>
          New goal
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="container max-w-2xl space-y-4 p-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-2/3 rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="h-16 rounded bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No goals yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={openCreate}>
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = progressForGoal(goal)
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground"
                          onClick={() => openEdit(goal)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {goal.description ? (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    ) : null}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-input">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{progress}%</p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <ul className="space-y-1">
                      {(goal.key_results ?? []).map((kr) => (
                        <li key={kr.id} className="flex items-center gap-2 text-sm group/item">
                          <button
                            type="button"
                            onClick={() => toggleKeyResult(kr)}
                            className={cn(
                              'rounded border p-0.5',
                              kr.done
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            )}
                            aria-label={kr.done ? 'Mark incomplete' : 'Mark done'}
                          >
                            {kr.done ? '✓' : '○'}
                          </button>
                          <span
                            className={cn(
                              'flex-1',
                              kr.done && 'text-muted-foreground line-through'
                            )}
                          >
                            {kr.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteKeyResult(kr.id)}
                          >
                            ×
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Add key result..."
                        value={newKrTitle[goal.id] ?? ''}
                        onChange={(e) =>
                          setNewKrTitle((prev) => ({ ...prev, [goal.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addKeyResult(goal.id)
                        }}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={() => addKeyResult(goal.id)}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit goal' : 'New goal'}</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Goal title"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveGoal}>Save</Button>
            </div>
          </DialogPanel>
        </DialogContent>
      </Dialog>
    </div>
  )
}
