import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface LogEntry {
  id: string
  type: string
  actor: string
  title: string
  description?: string
  context?: Record<string, unknown>
  session_id?: string
  duration_ms?: number
  status: string
  created_at: string
  related_type?: string
  related_id?: string
  tags?: string[]
}

export async function GET() {
  const supabase = await createSupabaseServerClient()

  // Get all logs for analysis
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const logs = (data || []) as LogEntry[]

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Calculate metrics
  const totalLogs = logs.length
  const logsToday = logs.filter((l: LogEntry) => new Date(l.created_at) > oneDayAgo).length
  const logsThisWeek = logs.filter((l: LogEntry) => new Date(l.created_at) > oneWeekAgo).length

  // Type distribution
  const typeDistribution = logs.reduce((acc: Record<string, number>, log: LogEntry) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {})

  // Actor distribution
  const actorDistribution = logs.reduce((acc: Record<string, number>, log: LogEntry) => {
    acc[log.actor] = (acc[log.actor] || 0) + 1
    return acc
  }, {})

  // Status distribution
  const statusDistribution = logs.reduce((acc: Record<string, number>, log: LogEntry) => {
    acc[log.status] = (acc[log.status] || 0) + 1
    return acc
  }, {})

  // Error rate
  const errorCount = logs.filter(
    (l: LogEntry) => l.type === 'error' || l.status === 'failed'
  ).length
  const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : '0'

  // Activity by hour (last 24h)
  const activityByHour: Record<string, number> = {}
  logs
    .filter((l: LogEntry) => new Date(l.created_at) > oneDayAgo)
    .forEach((log: LogEntry) => {
      const hour = new Date(log.created_at).getHours()
      activityByHour[hour] = (activityByHour[hour] || 0) + 1
    })

  // Recent dispatches
  const recentDispatches = logs.filter((l: LogEntry) => l.type === 'dispatch').slice(0, 10)

  // Average duration for completed actions
  const completedWithDuration = logs.filter(
    (l: LogEntry) => l.duration_ms && l.status === 'completed'
  )
  const avgDuration =
    completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce(
            (sum: number, l: LogEntry) => sum + (l.duration_ms || 0),
            0
          ) / completedWithDuration.length
        )
      : 0

  return NextResponse.json({
    summary: {
      totalLogs,
      logsToday,
      logsThisWeek,
      errorRate: `${errorRate}%`,
      avgDurationMs: avgDuration,
    },
    distributions: {
      byType: typeDistribution,
      byActor: actorDistribution,
      byStatus: statusDistribution,
    },
    activityByHour,
    recentDispatches,
  })
}
