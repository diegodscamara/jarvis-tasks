'use client'

import { Flame } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Habit {
  id: string
  name: string
  created_at: string
  streak: number
  completed_dates: string[]
}

function getWeekDays(): string[] {
  const out: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  if (dateStr === today.toISOString().slice(0, 10)) return 'Today'
  if (d.getTime() === today.getTime() - 86400000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const weekDays = getWeekDays()
  const todayStr = new Date().toISOString().slice(0, 10)

  const fetchHabits = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      setHabits(data.habits ?? [])
    } catch (error) {
      console.error('Failed to fetch habits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const createHabit = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setDialogOpen(false)
      setNewName('')
      fetchHabits()
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  const toggleToday = async (habit: Habit) => {
    const completed = habit.completed_dates.includes(todayStr)
    try {
      if (completed) {
        await fetch(`/api/habits/${habit.id}/complete?date=${todayStr}`, {
          method: 'DELETE',
        })
      } else {
        await fetch(`/api/habits/${habit.id}/complete`, { method: 'POST' })
      }
      fetchHabits()
    } catch (error) {
      console.error('Failed to toggle completion:', error)
    }
  }

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit?')) return
    try {
      await fetch(`/api/habits?id=${id}`, { method: 'DELETE' })
      fetchHabits()
    } catch (error) {
      console.error('Failed to delete habit:', error)
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
          <Flame className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Habits</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          New habit
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="container max-w-2xl space-y-6 p-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 rounded-lg bg-muted/50 animate-pulse" />
              <div className="h-32 rounded-lg bg-muted/50 animate-pulse" />
            </div>
          ) : habits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Flame className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No habits yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setDialogOpen(true)}
                >
                  Create your first habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Today</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between gap-2 rounded-md py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          checked={habit.completed_dates.includes(todayStr)}
                          onCheckedChange={() => toggleToday(habit)}
                          aria-label={`Mark ${habit.name} done for today`}
                        />
                        <span className="truncate font-medium">{habit.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">This week</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-border px-2 py-1.5 text-left font-medium">
                            Habit
                          </th>
                          {weekDays.map((d) => (
                            <th
                              key={d}
                              className={cn(
                                'border-b border-border px-1 py-1.5 text-center font-medium w-10',
                                d === todayStr && 'text-primary'
                              )}
                            >
                              {formatDay(d)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {habits.map((habit) => (
                          <tr key={habit.id}>
                            <td className="border-b border-border/50 px-2 py-1 truncate max-w-[120px]">
                              {habit.name}
                            </td>
                            {weekDays.map((d) => (
                              <td
                                key={d}
                                className={cn(
                                  'border-b border-border/50 px-1 py-1 text-center',
                                  d === todayStr && 'bg-muted/30'
                                )}
                              >
                                {habit.completed_dates.includes(d) ? (
                                  <span className="text-primary" aria-hidden>
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Morning run"
                className="mt-1"
                onKeyDown={(e) => e.key === 'Enter' && createHabit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createHabit} disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          </DialogPanel>
        </DialogContent>
      </Dialog>
    </div>
  )
}
