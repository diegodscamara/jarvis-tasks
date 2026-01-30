'use client'

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  Play,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Log {
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

interface Analytics {
  summary: {
    totalLogs: number
    logsToday: number
    logsThisWeek: number
    errorRate: string
    avgDurationMs: number
  }
  distributions: {
    byType: Record<string, number>
    byActor: Record<string, number>
    byStatus: Record<string, number>
  }
}

const LOG_TYPE_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  agent_action: { icon: Zap, color: 'text-blue-500 bg-blue-500/10', label: 'Action' },
  dispatch: { icon: Play, color: 'text-purple-500 bg-purple-500/10', label: 'Dispatch' },
  task_event: { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10', label: 'Task' },
  system_event: { icon: Settings, color: 'text-gray-500 bg-gray-500/10', label: 'System' },
  message: { icon: MessageSquare, color: 'text-cyan-500 bg-cyan-500/10', label: 'Message' },
  error: { icon: AlertCircle, color: 'text-red-500 bg-red-500/10', label: 'Error' },
  success: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', label: 'Success' },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLive, setIsLive] = useState(true)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')

      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/logs/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    fetchAnalytics()
  }, [fetchLogs, fetchAnalytics])

  // Polling for live updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchLogs()
    }, 5000)

    return () => clearInterval(interval)
  }, [isLive, fetchLogs])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return null
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Activity Logs</h1>
              <Button
                variant={isLive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? (
                  <>
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Live
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Paused
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(LOG_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-border">
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Total Logs</CardDescription>
                <CardTitle className="text-2xl">{analytics.summary.totalLogs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Today</CardDescription>
                <CardTitle className="text-2xl">{analytics.summary.logsToday}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>This Week</CardDescription>
                <CardTitle className="text-2xl">{analytics.summary.logsThisWeek}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Error Rate</CardDescription>
                <CardTitle className="text-2xl">{analytics.summary.errorRate}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardDescription>Avg Duration</CardDescription>
                <CardTitle className="text-2xl">
                  {formatDuration(analytics.summary.avgDurationMs) || 'N/A'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Logs Timeline */}
        <div className="flex-1 flex">
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found</p>
                <p className="text-sm mt-1">Activity will appear here in real-time</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {logs.map((log) => {
                  const config = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_CONFIG.agent_action
                  const Icon = config.icon
                  return (
                    <Card
                      key={log.id}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-accent/50',
                        selectedLog?.id === log.id && 'bg-accent'
                      )}
                      onClick={() => setSelectedLog(log)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn('p-2 rounded-lg', config.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{log.title}</span>
                              <Badge variant="outline" className={STATUS_COLORS[log.status]}>
                                {log.status}
                              </Badge>
                            </div>
                            {log.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {log.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{log.actor}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(log.created_at)}
                              </span>
                              {log.duration_ms && <span>{formatDuration(log.duration_ms)}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Log Detail Panel */}
          {selectedLog && (
            <div className="w-96 border-l border-border p-4">
              <h3 className="font-semibold mb-4">Log Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  <p className="font-medium">{selectedLog.title}</p>
                </div>
                {selectedLog.description && (
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <p className="text-sm">{selectedLog.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <p className="text-sm">{selectedLog.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedLog.status}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Actor</label>
                    <p className="text-sm">{selectedLog.actor}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Duration</label>
                    <p className="text-sm">{formatDuration(selectedLog.duration_ms) || 'N/A'}</p>
                  </div>
                </div>
                {selectedLog.session_id && (
                  <div>
                    <label className="text-xs text-muted-foreground">Session ID</label>
                    <p className="text-sm font-mono truncate">{selectedLog.session_id}</p>
                  </div>
                )}
                {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground">Context</label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
