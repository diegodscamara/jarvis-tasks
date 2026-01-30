'use client'

import { AlertTriangle, Calendar, CheckCircle2, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  completedThisWeek: number
  overdueCount: number
  upcomingCount: number
  streak: number
}

export function StatsWidget() {
  const [stats, setStats] = useState<Stats>({
    completedThisWeek: 0,
    overdueCount: 0,
    upcomingCount: 0,
    streak: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/tasks/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
          <p className="text-xs text-muted-foreground">tasks completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{stats.overdueCount}</div>
          <p className="text-xs text-muted-foreground">need attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingCount}</div>
          <p className="text-xs text-muted-foreground">upcoming tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streak}</div>
          <p className="text-xs text-muted-foreground">days productive</p>
        </CardContent>
      </Card>
    </div>
  )
}
