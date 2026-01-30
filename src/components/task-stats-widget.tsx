'use client'

import { AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface TaskStats {
  completedThisWeek: number
  overdueCount: number
  upcomingCount: number
}

export function TaskStatsWidget() {
  const [stats, setStats] = useState<TaskStats>({
    completedThisWeek: 0,
    overdueCount: 0,
    upcomingCount: 0,
  })

  useEffect(() => {
    fetch('/api/tasks/stats')
      .then((res) => res.ok && res.json())
      .then((data) => data && setStats(data))
      .catch(() => {})
  }, [])

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {stats.completedThisWeek} done this week
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {stats.overdueCount} overdue
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {stats.upcomingCount} due this week
        </span>
      </CardContent>
    </Card>
  )
}
