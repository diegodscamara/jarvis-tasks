import { headers } from 'next/headers'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { VelocityChart } from './velocity-chart'

interface AnalyticsOverview {
  total: number
  completionRate: number
  overdue: number
  recentlyCompleted: number
}

interface AnalyticsResponse {
  overview?: AnalyticsOverview
  error?: string
}

interface DetailedResponse {
  velocity?: Array<{ date: string; completed: number }>
  avgCompletionTimeHours?: number
  error?: string
}

function getBaseUrl(headersList: Awaited<ReturnType<typeof headers>>) {
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export default async function AnalyticsPage() {
  const headersList = await headers()
  const base = getBaseUrl(headersList)

  const [analyticsRes, detailedRes] = await Promise.all([
    fetch(`${base}/api/analytics`, { cache: 'no-store' }),
    fetch(`${base}/api/analytics/detailed`, { cache: 'no-store' }),
  ])

  const analytics: AnalyticsResponse = await analyticsRes.json().catch(() => ({}))
  const detailed: DetailedResponse = await detailedRes.json().catch(() => ({}))

  const overview = analytics.overview ?? {
    total: 0,
    completionRate: 0,
    overdue: 0,
    recentlyCompleted: 0,
  }
  const velocity = detailed.velocity ?? []
  const avgCycleHours = detailed.avgCompletionTimeHours ?? 0
  const velocityLast7 = velocity.slice(-7)

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track productivity and identify bottlenecks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-semibold tabular-nums">{overview.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-semibold tabular-nums">{overview.completionRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Done / total</p>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Cycle Time
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-semibold tabular-nums">
              {Number.isInteger(avgCycleHours) ? avgCycleHours : avgCycleHours.toFixed(1)}h
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Hours per task</p>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Count
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-semibold tabular-nums">{overview.overdue}</p>
            <p className="mt-1 text-xs text-muted-foreground">Past due, not done</p>
          </div>
        </Card>
      </div>

      <VelocityChart data={velocityLast7} />
    </div>
  )
}
