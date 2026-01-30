'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  calculateSprintMetrics, 
  getVelocityTrend, 
  formatDuration,
  estimateCompletionDate 
} from '@/lib/time-tracking'
import { Clock, TrendingUp, Target, Calendar } from 'lucide-react'
import type { Task } from '@/types'

interface SprintMetricsProps {
  tasks: Task[]
  startDate?: Date
  endDate?: Date
}

export function SprintMetrics({ 
  tasks, 
  startDate = new Date(new Date().setDate(new Date().getDate() - 7)),
  endDate = new Date()
}: SprintMetricsProps) {
  const metrics = useMemo(
    () => calculateSprintMetrics(tasks, startDate, endDate),
    [tasks, startDate, endDate]
  )
  
  const velocityTrend = useMemo(
    () => getVelocityTrend(tasks, 4),
    [tasks]
  )
  
  const remainingTasks = tasks.filter(t => t.status !== 'done')
  const remainingEstimate = remainingTasks.reduce((sum, t) => sum + (t.estimate || 0), 0)
  const completionDate = estimateCompletionDate(remainingEstimate, metrics.velocity)
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Velocity Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Velocity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.velocity.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            points per hour
          </p>
          <div className="mt-4 space-y-1">
            {velocityTrend.slice(-2).map((week, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{week.week}</span>
                <span>{week.velocity.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Time Tracking Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.totalSpent * 60)}
          </div>
          <p className="text-xs text-muted-foreground">
            of {formatDuration(metrics.totalEstimate * 60)} estimated
          </p>
          <Progress 
            value={(metrics.totalSpent / metrics.totalEstimate) * 100} 
            className="mt-3"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.averageAccuracy.toFixed(0)}% accuracy
          </p>
        </CardContent>
      </Card>
      
      {/* Sprint Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sprint Progress</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            tasks completed
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Remaining</span>
              <span>{remainingTasks.length} tasks</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimate</span>
              <span>{formatDuration(remainingEstimate * 60)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Completion Forecast Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Forecast</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {completionDate 
              ? completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'N/A'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            estimated completion
          </p>
          {completionDate && (
            <div className="mt-4 text-xs">
              <p className="text-muted-foreground">
                Based on current velocity
              </p>
              <p className="text-muted-foreground">
                {Math.ceil((completionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function BurndownChart({ tasks, startDate, endDate }: SprintMetricsProps) {
  const metrics = useMemo(
    () => calculateSprintMetrics(tasks, startDate || new Date(), endDate || new Date()),
    [tasks, startDate, endDate]
  )
  
  if (metrics.burndownData.length === 0) {
    return null
  }
  
  const maxEstimate = Math.max(...metrics.burndownData.map(d => Math.max(d.remainingEstimate, d.actualRemaining)))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Burndown Chart</CardTitle>
        <CardDescription>
          Sprint progress over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Simple SVG chart - in production would use a proper charting library */}
          <svg className="w-full h-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(percent => (
              <line
                key={percent}
                x1="0"
                y1={`${percent}%`}
                x2="100%"
                y2={`${percent}%`}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
            ))}
            
            {/* Ideal line */}
            <polyline
              points={metrics.burndownData.map((d, i) => 
                `${(i / (metrics.burndownData.length - 1)) * 100}%,${100 - (d.remainingEstimate / maxEstimate) * 100}%`
              ).join(' ')}
              fill="none"
              stroke="rgb(156, 163, 175)"
              strokeWidth="2"
              strokeDasharray="4"
            />
            
            {/* Actual line */}
            <polyline
              points={metrics.burndownData.map((d, i) => 
                `${(i / (metrics.burndownData.length - 1)) * 100}%,${100 - (d.actualRemaining / maxEstimate) * 100}%`
              ).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            
            {/* Data points */}
            {metrics.burndownData.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (metrics.burndownData.length - 1)) * 100}%`}
                cy={`${100 - (d.actualRemaining / maxEstimate) * 100}%`}
                r="3"
                fill="hsl(var(--primary))"
              />
            ))}
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-px bg-gray-400" style={{ borderTop: '2px dashed' }} />
              <span className="text-muted-foreground">Ideal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-px bg-primary" />
              <span>Actual</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}