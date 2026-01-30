# 📊 Advanced Analytics Dashboard - Implementation Plan

**Task ID**: 26404ae4-ec54-4b49-9d65-7627853fc599  
**Created**: 2026-01-30  
**Status**: Planning Complete

---

## 1. Current State Analysis

### Existing Infrastructure ✅
- **Database**: Supabase PostgreSQL with comprehensive schema
- **Analytics APIs**: 
  - `/api/analytics` - Basic overview (status, priority, projects, assignees)
  - `/api/analytics/detailed` - Time series data (velocity, completion trends)
  - `/api/tasks/stats` - Task-specific statistics
- **Visualization Library**: Recharts 2.15.4 already installed
- **UI Components**: Chart components (`src/components/ui/chart.tsx`) with theme support

### Current Data Structure

**Tasks Table**:
```typescript
{
  id: UUID
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'backlog' | 'planning' | 'todo' | 'in_progress' | 'review' | 'done'
  assignee: 'jarvis' | 'gemini' | 'copilot' | 'claude' | 'diego'
  project_id: UUID
  due_date: timestamp
  estimate: integer (points/time)
  parent_id: UUID (for subtasks)
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_interval: integer
  time_spent: integer
  created_at: timestamp
  updated_at: timestamp
}
```

**Related Tables**:
- `projects` - Project metadata (name, icon, color, lead)
- `labels` - Task labels with grouping
- `task_labels` - Many-to-many junction
- `task_dependencies` - Dependency tracking
- `comments` - Task discussions
- `attachments` - File attachments

---

## 2. Proposed Metrics & Analytics

### 2.1 Core Metrics

#### A. Productivity Metrics
| Metric | Calculation | Data Source |
|--------|-------------|-------------|
| **Tasks Completed** | Count by day/week/month | `tasks.updated_at` where `status = 'done'` |
| **Completion Velocity** | Tasks completed / time period | 30-day rolling average |
| **Average Cycle Time** | Mean(updated_at - created_at) for done tasks | Tasks with status = 'done' |
| **Work in Progress (WIP)** | Count where status = 'in_progress' | Real-time count |
| **Lead Time** | Time from todo → done | Status transition tracking |

#### B. Efficiency Metrics
| Metric | Calculation | Data Source |
|--------|-------------|-------------|
| **Completion Rate** | Done / Total tasks × 100% | All tasks |
| **On-Time Delivery** | Tasks completed before due_date / total with due_date | Tasks with due_date |
| **Estimation Accuracy** | Compare estimate vs time_spent | Tasks with both fields |
| **Blocked Time** | Sum of time in dependencies | task_dependencies |
| **Rework Rate** | Tasks moved from review back to in_progress | Status change history (needs implementation) |

#### C. Distribution Metrics
| Metric | Visualization | Purpose |
|--------|---------------|---------|
| **Status Distribution** | Bar/Donut chart | Identify bottlenecks |
| **Priority Distribution** | Stacked bar | Understand workload urgency |
| **Project Distribution** | Pie chart | Resource allocation |
| **Assignee Workload** | Horizontal bar | Balance work distribution |
| **Label Usage** | Tag cloud / Bar | Popular categories |

#### D. Time-Based Trends
| Metric | Visualization | Insights |
|--------|---------------|----------|
| **Daily Completion Trend** | Line chart (30 days) | Productivity patterns |
| **Weekly Velocity** | Bar chart (12 weeks) | Sprint performance |
| **Monthly Overview** | Calendar heatmap | Long-term trends |
| **Day of Week Pattern** | Radar/Bar chart | Peak productivity days |
| **Hour of Day (if tracked)** | Heatmap | Optimal working hours |

---

## 3. Dashboard Design

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard                    [Date Range ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   128    │  │   87%    │  │  15.2h   │  │    12    │   │
│  │  Total   │  │Complete  │  │Avg Time  │  │ Overdue  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📈 Completion Velocity (30 days)                      │  │
│  │ [Line chart showing daily completions]                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ 🔄 Status Distribution │  │ 🎯 Priority Breakdown     │  │
│  │ [Donut chart]          │  │ [Stacked horizontal bar]  │  │
│  └────────────────────────┘  └───────────────────────────┘  │
│                                                              │
│  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ 👥 By Assignee         │  │ 📁 By Project             │  │
│  │ [Grouped bar chart]    │  │ [Pie chart with legend]   │  │
│  └────────────────────────┘  └───────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📅 Weekly Productivity Pattern                        │  │
│  │ [Radar chart - Sun to Sat]                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🏆 Top Performers (By completion)                     │  │
│  │ [Leaderboard table]                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Color Scheme (Linear-inspired)

**Status Colors** (from existing schema):
- Backlog: `#6B7280` (gray)
- Planning: `#8B5CF6` (purple)
- Todo: `#3B82F6` (blue)
- In Progress: `#F59E0B` (amber)
- Review: `#EC4899` (pink)
- Done: `#10B981` (green)

**Priority Colors**:
- High: `#EF4444` (red)
- Medium: `#F59E0B` (amber)
- Low: `#6B7280` (gray)

**Chart Theme**:
- Background: Dark theme (`#0A0A0A`)
- Grid lines: `#1F1F1F`
- Text: `#A1A1AA` (muted)
- Accent: Project colors from database

---

## 4. Component Architecture

### 4.1 File Structure
```
src/app/analytics/
├── page.tsx                    # Main analytics page
├── layout.tsx                  # Analytics layout with filters
└── components/
    ├── MetricCard.tsx          # KPI cards (reusable)
    ├── VelocityChart.tsx       # Line chart for completions
    ├── StatusDistribution.tsx  # Donut chart
    ├── PriorityBreakdown.tsx   # Stacked bar
    ├── AssigneeChart.tsx       # Grouped bar
    ├── ProjectChart.tsx        # Pie chart
    ├── WeeklyPattern.tsx       # Radar chart
    ├── TopPerformers.tsx       # Table/leaderboard
    └── DateRangeFilter.tsx     # Filter component
```

### 4.2 API Endpoints (New)

**GET `/api/analytics/time-series`**
```typescript
// Query params: startDate, endDate, granularity (day|week|month)
{
  completions: Array<{ date: string, count: number }>,
  creations: Array<{ date: string, count: number }>,
  velocity: number, // avg per period
}
```

**GET `/api/analytics/bottlenecks`**
```typescript
{
  staleInProgress: Task[], // >7 days in progress
  blockedTasks: Task[],    // with dependencies
  overdueCount: number,
  avgReviewTime: number,   // hours in review
}
```

**GET `/api/analytics/estimates`**
```typescript
{
  withEstimates: number,
  withoutEstimates: number,
  avgAccuracy: number, // estimate vs time_spent
  overestimated: number,
  underestimated: number,
}
```

**GET `/api/analytics/dependencies`**
```typescript
{
  totalDependencies: number,
  longestChain: number,
  criticalPath: Task[],
  circularDeps: Array<{ taskIds: string[] }>,
}
```

### 4.3 Data Fetching Strategy

**Option A: Server Components (Recommended)**
- Fetch data in `page.tsx` server component
- Pass as props to client components
- Benefits: SEO, faster initial load, no loading states

**Option B: Client-side with SWR/React Query**
- Use `useSWR` for real-time updates
- Benefits: Live data, optimistic updates
- Requires loading states

**Hybrid Approach** (Recommended):
- Server-side initial data
- Client-side polling for updates (30s interval)
- WebSocket updates for real-time metrics

---

## 5. Visualization Components

### 5.1 Chart Component Specifications

#### VelocityChart (Line Chart)
```typescript
// Using Recharts LineChart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={velocityData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="completed" stroke="#10B981" />
    <Line type="monotone" dataKey="created" stroke="#3B82F6" />
  </LineChart>
</ResponsiveContainer>
```

#### StatusDistribution (Donut Chart)
```typescript
// Using Recharts PieChart
<ResponsiveContainer width="100%" height={250}>
  <PieChart>
    <Pie
      data={statusData}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={80}
      dataKey="value"
      label
    >
      {statusData.map((entry, index) => (
        <Cell key={index} fill={STATUS_COLORS[entry.name]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

#### AssigneeChart (Grouped Bar)
```typescript
// Using Recharts BarChart
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={assigneeData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="assignee" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="todo" fill="#3B82F6" />
    <Bar dataKey="inProgress" fill="#F59E0B" />
    <Bar dataKey="done" fill="#10B981" />
  </BarChart>
</ResponsiveContainer>
```

### 5.2 Interactive Features

**Date Range Selector**:
```typescript
const presets = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
]
```

**Drill-down Interactions**:
- Click status segment → filter task list
- Click project → show project details
- Click assignee → show assignee workload
- Hover chart → show detailed tooltip

**Export Options**:
- CSV export for data
- PNG export for charts
- PDF report generation

---

## 6. Advanced Features (Future)

### 6.1 Predictive Analytics
- **Completion Forecasting**: Predict when backlog will be cleared
- **Bottleneck Detection**: ML-based pattern recognition
- **Burndown Charts**: Sprint progress tracking
- **Resource Allocation**: Suggest assignee balancing

### 6.2 Custom Dashboards
- Save custom views
- User preferences (which charts to show)
- Dashboard templates (developer, manager, executive)

### 6.3 Comparative Analytics
- Week-over-week trends
- Project comparisons
- Assignee performance benchmarking
- Historical snapshots

### 6.4 Real-time Insights
- Live task completion notifications
- Velocity alerts (below threshold)
- Overdue task warnings
- Dependency block alerts

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Basic analytics page with core metrics

- [ ] Create `/app/analytics/page.tsx` route
- [ ] Implement 4 KPI cards (Total, Completion %, Avg Time, Overdue)
- [ ] Add `VelocityChart` component (30-day line chart)
- [ ] Add `StatusDistribution` component (donut chart)
- [ ] Implement date range filter
- [ ] Connect to existing `/api/analytics` endpoint
- [ ] Apply Linear-inspired theme

**Deliverables**:
- Analytics page accessible at `/analytics`
- Basic overview with 2-3 charts
- Responsive layout

---

### Phase 2: Enhanced Visualizations (Week 2)
**Goal**: Add remaining charts and interactivity

- [ ] Implement `PriorityBreakdown` component
- [ ] Implement `AssigneeChart` component
- [ ] Implement `ProjectChart` component
- [ ] Implement `WeeklyPattern` component (radar chart)
- [ ] Add `TopPerformers` leaderboard
- [ ] Create `/api/analytics/time-series` endpoint
- [ ] Add chart click interactions (drill-down)
- [ ] Add loading states and error handling

**Deliverables**:
- Complete dashboard with 7+ visualizations
- Interactive filtering
- Smooth animations

---

### Phase 3: Advanced Analytics (Week 3)
**Goal**: Deep insights and bottleneck detection

- [ ] Create `/api/analytics/bottlenecks` endpoint
- [ ] Create `/api/analytics/estimates` endpoint
- [ ] Create `/api/analytics/dependencies` endpoint
- [ ] Add bottleneck detection UI
- [ ] Add estimation accuracy chart
- [ ] Add dependency graph visualization
- [ ] Implement real-time updates (WebSocket)
- [ ] Add export functionality (CSV, PNG)

**Deliverables**:
- Advanced insights page
- Bottleneck alerts
- Data export features

---

### Phase 4: Polish & Optimization (Week 4)
**Goal**: Performance, UX, and documentation

- [ ] Performance optimization (memoization, lazy loading)
- [ ] Add chart animations
- [ ] Implement custom date range picker
- [ ] Add analytics preferences (save view)
- [ ] Create analytics documentation
- [ ] Add E2E tests for analytics page
- [ ] SEO optimization
- [ ] Mobile responsiveness review

**Deliverables**:
- Production-ready analytics dashboard
- Full test coverage
- User documentation

---

## 8. Technical Considerations

### 8.1 Performance
- **Database Indexing**: Ensure indexes on `created_at`, `updated_at`, `status`
- **Query Optimization**: Use aggregation queries, not full table scans
- **Caching**: Cache analytics data for 5 minutes (stale-while-revalidate)
- **Pagination**: Limit data fetches to date ranges
- **Lazy Loading**: Load charts progressively as user scrolls

### 8.2 Data Accuracy
- **Timezone Handling**: All dates in UTC, display in user timezone
- **Null Handling**: Handle tasks without estimates/due dates
- **Real-time Sync**: Subscribe to task updates for live metrics
- **Historical Data**: Consider creating analytics snapshot table

### 8.3 Accessibility
- **ARIA Labels**: All charts have descriptive labels
- **Keyboard Navigation**: Tab through chart elements
- **Screen Readers**: Provide data tables as alternative
- **Color Contrast**: Ensure WCAG AA compliance
- **High Contrast Mode**: Support system preferences

### 8.4 Mobile Optimization
- **Responsive Charts**: Use `ResponsiveContainer`
- **Touch Interactions**: Swipe for date ranges
- **Simplified View**: Show fewer charts on small screens
- **Progressive Disclosure**: Expand details on tap

---

## 9. Database Enhancements (Optional)

### 9.1 New Tables

**`analytics_snapshots`** (for historical tracking):
```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**`task_status_history`** (for transition tracking):
```sql
CREATE TABLE task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-populate on task update
CREATE TRIGGER track_status_changes
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();
```

### 9.2 Materialized Views (for performance)

```sql
-- Daily aggregation
CREATE MATERIALIZED VIEW analytics_daily AS
SELECT 
  DATE(updated_at) as date,
  COUNT(*) FILTER (WHERE status = 'done') as completed,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
FROM tasks
GROUP BY DATE(updated_at);

-- Refresh nightly
CREATE INDEX ON analytics_daily(date);
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Test metric calculations (completion rate, avg time)
- Test data transformations for charts
- Test date range filtering logic
- Mock Supabase queries

### 10.2 Integration Tests
- Test API endpoints with real database
- Verify correct data aggregation
- Test edge cases (no data, single task, etc.)

### 10.3 E2E Tests (Playwright)
```typescript
test('Analytics dashboard loads and displays charts', async ({ page }) => {
  await page.goto('/analytics')
  
  // Check KPI cards
  await expect(page.locator('[data-testid="total-tasks"]')).toBeVisible()
  
  // Check charts render
  await expect(page.locator('[data-testid="velocity-chart"]')).toBeVisible()
  
  // Test date filter
  await page.click('[data-testid="date-filter"]')
  await page.click('text=Last 7 days')
  await expect(page).toHaveURL(/dateRange=7/)
})
```

---

## 11. Success Metrics

### 11.1 Technical Metrics
- Page load time < 2s
- Time to interactive < 3s
- API response time < 500ms
- Charts render < 1s
- Mobile performance score > 90

### 11.2 User Metrics
- Daily active users on analytics page
- Average session duration > 2 min
- Chart interaction rate > 50%
- Export feature usage
- Mobile vs desktop traffic

### 11.3 Business Metrics
- Improved task completion velocity (measurable)
- Reduced WIP (work in progress)
- Better on-time delivery rate
- Increased estimation accuracy
- Faster bottleneck identification

---

## 12. Dependencies & Libraries

### Current Stack ✅
- **Next.js 15** - React framework
- **Recharts 2.15.4** - Chart library
- **Supabase** - Database & real-time
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation

### Additional (if needed)
- **React Query / SWR** - Data fetching (optional)
- **jsPDF** - PDF export (if needed)
- **html2canvas** - Chart screenshots (if needed)
- **D3.js** - Advanced custom charts (if Recharts insufficient)

---

## 13. Documentation Requirements

### 13.1 User Documentation
- [ ] Analytics dashboard overview guide
- [ ] Metric definitions glossary
- [ ] How to interpret charts
- [ ] Export data instructions
- [ ] FAQ for common questions

### 13.2 Developer Documentation
- [ ] Analytics API reference
- [ ] Chart component API
- [ ] Adding new metrics guide
- [ ] Database schema for analytics
- [ ] Performance optimization tips

---

## 14. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Slow queries on large datasets** | High | Add indexes, pagination, caching |
| **Real-time updates causing performance issues** | Medium | Throttle updates, use debouncing |
| **Charts not rendering on mobile** | Medium | Responsive testing, fallback tables |
| **Timezone confusion** | Medium | Clear UTC labels, user timezone display |
| **Data privacy concerns** | Low | Respect RLS policies, no PII in charts |
| **Browser compatibility** | Low | Test on Chrome, Safari, Firefox |

---

## 15. Next Steps

### Immediate Actions
1. **Review this plan** with Diego/Jarvis
2. **Create Linear task** for Phase 1 implementation
3. **Set up analytics route** (`/app/analytics`)
4. **Design mockups** (optional - Figma or code prototype)
5. **Database review** - Check if status history tracking needed

### Week 1 Sprint Goals
- Analytics page accessible and functional
- 4 KPI cards + 2 charts minimum
- Connect to existing API endpoints
- Responsive layout working

### Future Considerations
- **AI-powered insights**: "Your productivity is 20% higher on Mondays"
- **Slack/Discord notifications**: "Weekly report: 45 tasks completed"
- **Gamification**: Badges for completion streaks
- **Team analytics**: If multi-user in future

---

## 16. Appendix

### A. Example Queries

**Get 30-day velocity**:
```sql
SELECT 
  DATE(updated_at) as date,
  COUNT(*) as completed
FROM tasks
WHERE status = 'done' 
  AND updated_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(updated_at)
ORDER BY date;
```

**Get bottlenecks**:
```sql
SELECT t.*
FROM tasks t
LEFT JOIN task_dependencies td ON t.id = td.task_id
WHERE t.status = 'in_progress'
  AND (
    t.updated_at < NOW() - INTERVAL '7 days'
    OR td.depends_on_id IS NOT NULL
  );
```

**Estimation accuracy**:
```sql
SELECT 
  AVG(ABS(estimate - time_spent)) as avg_error,
  COUNT(*) FILTER (WHERE estimate < time_spent) as underestimated,
  COUNT(*) FILTER (WHERE estimate > time_spent) as overestimated
FROM tasks
WHERE estimate IS NOT NULL AND time_spent IS NOT NULL;
```

---

### B. Color Reference

```typescript
export const CHART_COLORS = {
  status: {
    backlog: '#6B7280',
    planning: '#8B5CF6',
    todo: '#3B82F6',
    in_progress: '#F59E0B',
    review: '#EC4899',
    done: '#10B981',
  },
  priority: {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#6B7280',
  },
  agents: {
    jarvis: '#3B82F6',
    gemini: '#8B5CF6',
    copilot: '#10B981',
    claude: '#F59E0B',
    diego: '#EC4899',
  },
}
```

---

### C. Sample Component

**MetricCard.tsx** (reusable KPI card):
```typescript
interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  icon 
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{title}</span>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-white">{value}</span>
        {trendValue && (
          <span className={cn(
            "text-sm",
            trend === 'up' && "text-green-500",
            trend === 'down' && "text-red-500",
            trend === 'neutral' && "text-gray-500"
          )}>
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  )
}
```

---

**End of Plan** 🎉

This plan provides a complete blueprint for implementing advanced analytics in Jarvis Tasks. The phased approach allows for iterative development with value delivered at each stage.
