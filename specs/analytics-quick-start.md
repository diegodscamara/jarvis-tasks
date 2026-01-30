# 📊 Analytics Dashboard - Quick Start Guide

**For**: Developers implementing the analytics dashboard  
**Time to first chart**: ~30 minutes  
**Reference**: See `analytics-dashboard-plan.md` for full specification

---

## 🚀 Phase 1 Implementation Checklist

### Step 1: Create Analytics Route (5 min)

```bash
# Create the analytics directory
mkdir -p /root/jarvis-tasks/src/app/analytics/components
touch /root/jarvis-tasks/src/app/analytics/page.tsx
touch /root/jarvis-tasks/src/app/analytics/layout.tsx
```

### Step 2: Basic Layout (10 min)

**File**: `src/app/analytics/layout.tsx`
```typescript
export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Analytics</h1>
        <p className="text-muted-foreground">
          Track productivity and identify bottlenecks
        </p>
      </div>
      {children}
    </div>
  )
}
```

### Step 3: Fetch Data (Server Component) (10 min)

**File**: `src/app/analytics/page.tsx`
```typescript
import * as db from '@/lib/supabase/queries'
import { MetricCard } from './components/MetricCard'
import { VelocityChart } from './components/VelocityChart'

export default async function AnalyticsPage() {
  // Fetch data server-side
  const analytics = await fetch('http://localhost:3000/api/analytics').then(r => r.json())
  const detailed = await fetch('http://localhost:3000/api/analytics/detailed').then(r => r.json())

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Tasks"
          value={analytics.overview.total}
          subtitle="All time"
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.overview.completionRate}%`}
          trend="up"
          trendValue="+5%"
        />
        <MetricCard
          title="Avg Completion Time"
          value={`${detailed.avgCompletionTimeHours}h`}
          subtitle="Hours per task"
        />
        <MetricCard
          title="Overdue"
          value={analytics.overview.overdue}
          trend={analytics.overview.overdue > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Velocity Chart */}
      <VelocityChart data={detailed.velocity} />
    </div>
  )
}
```

### Step 4: MetricCard Component (5 min)

**File**: `src/app/analytics/components/MetricCard.tsx`
```typescript
'use client'

import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function MetricCard({ title, value, subtitle, trend, trendValue }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-semibold">{value}</h3>
        {trendValue && (
          <span
            className={cn(
              'text-sm',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500'
            )}
          >
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
```

### Step 5: VelocityChart Component (15 min)

**File**: `src/app/analytics/components/VelocityChart.tsx`
```typescript
'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

interface VelocityChartProps {
  data: Array<{ date: string; completed: number }>
}

export function VelocityChart({ data }: VelocityChartProps) {
  const chartConfig = {
    completed: {
      label: 'Completed',
      color: '#10B981', // green
    },
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">📈 30-Day Velocity</h3>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value) => [`${value} tasks`, 'Completed']}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="var(--color-completed)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
```

---

## 🎯 Quick Wins (Add these next)

### 1. Status Distribution (Donut Chart)

```typescript
// src/app/analytics/components/StatusChart.tsx
'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const STATUS_COLORS = {
  backlog: '#6B7280',
  todo: '#3B82F6',
  in_progress: '#F59E0B',
  review: '#EC4899',
  done: '#10B981',
}

export function StatusChart({ data }) {
  const chartData = Object.entries(data.status).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    color: STATUS_COLORS[status],
  }))

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">🔄 Status Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 2. Add Navigation Link

**File**: `src/app/layout.tsx` or sidebar component
```typescript
<Link href="/analytics" className="flex items-center gap-2">
  <AnalyticsIcon size={20} />
  Analytics
</Link>
```

---

## 🧪 Test It

```bash
# Start dev server
pnpm dev

# Navigate to
http://localhost:3000/analytics

# Expected result:
# - 4 KPI cards at top
# - 30-day velocity line chart
# - Responsive layout
```

---

## 📊 Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ /analytics page │  (Server Component)
│  - Fetch data   │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│  /api/analytics  │
│  - Aggregate     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Supabase      │
│  - tasks table   │
└──────────────────┘
```

---

## 🐛 Common Issues

### Issue: Charts not rendering
**Solution**: Ensure Recharts is installed
```bash
pnpm add recharts
```

### Issue: API returns 404
**Solution**: Check API route exists at `src/app/api/analytics/route.ts`

### Issue: "Cannot read property 'overview'"
**Solution**: Add error handling
```typescript
if (!analytics?.overview) {
  return <div>Loading analytics...</div>
}
```

---

## ✅ Phase 1 Done Criteria

- [ ] Analytics page accessible at `/analytics`
- [ ] 4 KPI cards displaying correct data
- [ ] Velocity chart showing 30-day trend
- [ ] Page loads in < 2 seconds
- [ ] Mobile responsive
- [ ] Dark theme applied

---

## 🔜 Phase 2 Preview

Next components to add:
1. **StatusChart** - Donut chart (status distribution)
2. **PriorityChart** - Stacked bar (priority breakdown)
3. **AssigneeChart** - Grouped bar (workload by assignee)
4. **DateRangeFilter** - User can select date range
5. **ProjectChart** - Pie chart (tasks by project)

Estimated time: 2-3 hours

---

## 💡 Pro Tips

1. **Use existing chart component**: `src/components/ui/chart.tsx` has theme integration
2. **Leverage existing API**: `/api/analytics` already has most data
3. **Server components FTW**: No loading states, SEO-friendly
4. **Copy Linear's colors**: Already defined in ROADMAP.md
5. **Test with real data**: Use existing tasks in database

---

## 📚 Resources

- [Recharts Documentation](https://recharts.org/)
- [Full Analytics Plan](./analytics-dashboard-plan.md)
- [Linear Analytics](https://linear.app/docs/analytics) - Inspiration
- [Existing API](../src/app/api/analytics/route.ts) - Current implementation

---

**Ready to code?** Start with Step 1 above! 🚀
