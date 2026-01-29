# Jarvis Tasks - Maintenance & Recurring Tasks

## Daily Tasks

### 1. Health Check
```bash
# Quick status check
curl -s http://localhost:3000/api/tasks | jq '.tasks | length'

# Check for errors in logs
pm2 logs jarvis-tasks --lines 50 --err
```

### 2. Backup Database
```bash
# SQLite backup
cp data/jarvis-tasks.db data/backups/jarvis-tasks-$(date +%Y%m%d).db

# Keep last 7 days of backups
find data/backups -name "*.db" -mtime +7 -delete
```

---

## Weekly Tasks

### 1. Code Quality Audit
```bash
# Full check suite
pnpm check

# Check for type errors
pnpm typecheck

# Look for unused exports
npx ts-prune
```

### 2. Dependency Review
```bash
# Check for outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit

# Update minor versions
pnpm update
```

### 3. Component Consistency Check
```bash
# Find raw HTML that should be shadcn
grep -r "type=\"checkbox\"\|<button \|<select \|<input " src/components/*.tsx src/app/*.tsx 2>/dev/null | grep -v "components/ui"

# Fix any violations found
```

### 4. Database Cleanup
```bash
# Open Drizzle Studio
pnpm db:studio

# Check for:
# - Orphaned task_labels (labels for deleted tasks)
# - Tasks with invalid projectId references
# - Old notifications (>30 days)
```

---

## Monthly Tasks

### 1. Performance Audit
```bash
# Build and analyze bundle
ANALYZE=true pnpm build

# Check bundle size
du -sh .next/static/chunks

# Target: < 200KB first load JS
```

### 2. Schema Review
- Review `src/db/schema.ts` for unused columns
- Check indexes are appropriate for query patterns
- Verify foreign key relationships

### 3. Documentation Update
- Review and update BEST-PRACTICES.md
- Update CLAUDE.md if new patterns emerged
- Add new components to component index

### 4. Cleanup Stale Code
```bash
# Find unused files
npx unimported

# Find dead code
npx knip

# Remove commented-out code
git diff HEAD~30 --stat | grep -E '^\+'
```

---

## Quarterly Tasks

### 1. Major Dependency Updates
```bash
# Update major versions carefully
pnpm update --latest

# Test thoroughly after major updates
pnpm check
```

### 2. Security Review
- Review API route authentication
- Check for exposed secrets in code
- Audit third-party dependencies

### 3. Architecture Review
- Is the folder structure still appropriate?
- Are there opportunities to extract shared logic?
- Review component boundaries

---

## Automation Scripts

### Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="data/backups"
DB_FILE="data/jarvis-tasks.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/jarvis-tasks-$DATE.db"

# Keep last 30 backups
ls -t "$BACKUP_DIR"/*.db | tail -n +31 | xargs -r rm

echo "Backup complete: $BACKUP_DIR/jarvis-tasks-$DATE.db"
```

### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

echo "=== Jarvis Tasks Health Check ==="

# Check if app is running
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ App is running"
else
  echo "❌ App is not responding"
  exit 1
fi

# Check task count
TASK_COUNT=$(curl -s http://localhost:3000/api/tasks | jq '.tasks | length')
echo "📋 Total tasks: $TASK_COUNT"

# Check database size
DB_SIZE=$(du -h data/jarvis-tasks.db | cut -f1)
echo "💾 Database size: $DB_SIZE"

# Check disk space
DISK_FREE=$(df -h . | tail -1 | awk '{print $4}')
echo "💿 Disk free: $DISK_FREE"

echo "=== Health Check Complete ==="
```

### Quality Gate Script
```bash
#!/bin/bash
# scripts/quality-gate.sh

echo "Running quality gates..."

# Type check
echo "1/3 Type checking..."
pnpm typecheck || exit 1

# Lint
echo "2/3 Linting..."
pnpm lint || exit 1

# Build
echo "3/3 Building..."
pnpm build || exit 1

echo "✅ All quality gates passed!"
```

---

## Cron Jobs

### Example crontab
```cron
# Backup database daily at 2 AM
0 2 * * * /root/jarvis-tasks/scripts/backup.sh

# Health check every 5 minutes
*/5 * * * * /root/jarvis-tasks/scripts/health-check.sh >> /var/log/jarvis-health.log 2>&1

# Cleanup old backups weekly
0 3 * * 0 find /root/jarvis-tasks/data/backups -name "*.db" -mtime +7 -delete
```

---

## Quality Metrics to Track

| Metric | Target | How to Check |
|--------|--------|--------------|
| First Load JS | < 200KB | `pnpm build` output |
| Type Coverage | 100% | `pnpm typecheck` |
| Lint Errors | 0 | `pnpm lint` |
| Build Time | < 60s | `time pnpm build` |
| DB Size | < 100MB | `du -h data/*.db` |
| Unused Deps | 0 | `npx depcheck` |

---

## Troubleshooting

### App Won't Start
```bash
# Check for port conflicts
lsof -i :3000

# Check Node version
node --version  # Should be 20+

# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Database Locked
```bash
# Check for open connections
lsof data/jarvis-tasks.db

# Force unlock (dangerous - ensure no writes in progress)
sqlite3 data/jarvis-tasks.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### TypeScript Errors After Update
```bash
# Clear TS cache
rm -rf node_modules/.cache

# Regenerate types
pnpm typecheck
```
