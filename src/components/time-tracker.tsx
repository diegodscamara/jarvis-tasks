'use client'

import { Clock, Pause, Play, Square, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatDuration } from '@/lib/time-tracking'
import type { Task } from '@/types'

interface TimeTrackerProps {
  task: Task
  onUpdate: (timeSpent: number) => void
}

export function TimeTracker({ task, onUpdate }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(task.timeSpent || 0)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualHours, setManualHours] = useState('')
  const [manualMinutes, setManualMinutes] = useState('')

  // Update timer every minute
  useEffect(() => {
    if (!isTracking || !sessionStart) return

    const interval = setInterval(() => {
      const now = new Date()
      const sessionMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))
      setCurrentTime((task.timeSpent || 0) + sessionMinutes / 60)
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [isTracking, sessionStart, task.timeSpent])

  const startTracking = () => {
    setIsTracking(true)
    setSessionStart(new Date())
  }

  const pauseTracking = () => {
    if (!sessionStart) return

    const now = new Date()
    const sessionMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))
    const newTotal = (task.timeSpent || 0) + sessionMinutes / 60

    setIsTracking(false)
    setSessionStart(null)
    setCurrentTime(newTotal)
    onUpdate(newTotal)
  }

  const resetTracking = () => {
    if (confirm('Are you sure you want to reset the time tracking for this task?')) {
      setIsTracking(false)
      setSessionStart(null)
      setCurrentTime(0)
      onUpdate(0)
    }
  }

  const handleManualEntry = () => {
    const hours = parseFloat(manualHours) || 0
    const minutes = parseFloat(manualMinutes) || 0
    const totalHours = hours + minutes / 60

    setCurrentTime(totalHours)
    onUpdate(totalHours)
    setShowManualEntry(false)
    setManualHours('')
    setManualMinutes('')
  }

  const getSessionTime = () => {
    if (!isTracking || !sessionStart) return 0
    const now = new Date()
    return Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))
  }

  const totalMinutes = currentTime * 60 + getSessionTime()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Time Tracking</span>
        </div>
        <div className="text-sm font-mono">{formatDuration(Math.round(totalMinutes))}</div>
      </div>

      <div className="flex items-center gap-2">
        {!isTracking ? (
          <Button variant="outline" size="sm" onClick={startTracking} className="flex-1">
            <Play size={14} className="mr-1" />
            Start
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={pauseTracking} className="flex-1">
            <Pause size={14} className="mr-1" />
            Pause
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => setShowManualEntry(true)}>
          Manual
        </Button>

        <Button variant="ghost" size="sm" onClick={resetTracking} title="Reset timer">
          <Square size={14} />
        </Button>
      </div>

      {task.estimate && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span>
              {formatDuration(Math.round(totalMinutes))} / {formatDuration(task.estimate * 60)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min(100, (totalMinutes / (task.estimate * 60)) * 100)}%`,
              }}
            />
          </div>
          {totalMinutes > task.estimate * 60 && (
            <p className="text-xs text-orange-500">
              Over estimate by {formatDuration(Math.round(totalMinutes - task.estimate * 60))}
            </p>
          )}
        </div>
      )}

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Time Entry</DialogTitle>
            <DialogDescription>Enter the time you've spent on this task</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Hours</label>
                <Input
                  type="number"
                  min="0"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Minutes</label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowManualEntry(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleManualEntry}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function TimeEstimate({
  estimate,
  onChange,
}: {
  estimate?: number
  onChange: (estimate: number | undefined) => void
}) {
  const [hours, setHours] = useState(estimate ? Math.floor(estimate) : '')
  const [minutes, setMinutes] = useState(estimate ? Math.round((estimate % 1) * 60) : '')

  const handleChange = (newHours: string, newMinutes: string) => {
    const h = parseFloat(newHours) || 0
    const m = parseFloat(newMinutes) || 0

    if (h === 0 && m === 0) {
      onChange(undefined)
    } else {
      onChange(h + m / 60)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1">
        <TrendingUp size={14} />
        Time Estimate
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            className="w-16"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value)
              handleChange(e.target.value, minutes.toString())
            }}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">h</span>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            max="59"
            className="w-16"
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value)
              handleChange(hours.toString(), e.target.value)
            }}
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">m</span>
        </div>
      </div>
    </div>
  )
}
