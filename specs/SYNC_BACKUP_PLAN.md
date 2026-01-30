# 🔄 Sync & Backup Feature - Implementation Plan

**Task ID**: b7235e5e-338c-4bdc-81f2-68a855ea4ecd  
**Status**: Planning Complete  
**Date**: 2026-01-30

---

## 📊 Current Architecture Analysis

### Data Storage
- **Primary Database**: Supabase PostgreSQL (South America - São Paulo region)
  - Project: `jarvis-tasks` (lypguwgnnjnvieyophaa)
  - Connected via Supabase CLI (version 2.72.7)
  
### Database Schema
**Core Tables:**
1. `tasks` - Main task data with full metadata
2. `projects` - Project categorization
3. `labels` - Task labeling system
4. `task_labels` - Junction table
5. `task_links` - External links (GitHub PRs, Linear tickets, etc.)
6. `task_dependencies` - Dependency graph
7. `comments` - Task discussions
8. `attachments` - File attachments
9. `notifications` - User notifications
10. `documents` - Knowledge base with versioning
11. `logs` - Agent activity and system events
12. `users` - User profiles and preferences

### Existing Export/Import
✅ **Already Implemented:**
- `/api/export` endpoint - JSON/CSV export
- `/api/import` endpoint - JSON import with upsert logic
- Exports include: tasks, projects, labels, task_labels

⚠️ **Current Limitations:**
- No scheduled backups
- No automated sync
- Missing: comments, attachments, dependencies, documents, logs
- No versioning or incremental backups
- No cloud storage integration
- No restore UI

### Local Files
- `data/notifications.json` - Currently empty (unused)
- No other local JSON storage

---

## 🎯 Backup Strategy Options

### 1. Database-Level Backups (Supabase Native)

**Supabase Built-in:**
- ✅ Daily automated backups (retained 7 days on Free tier, 30+ days on Pro)
- ✅ Point-in-time recovery (Pro plan only)
- ✅ Manual backups via Supabase Dashboard
- ❌ No local control or custom scheduling

**Supabase CLI Dump:**
```bash
supabase db dump --linked -f backup.sql
supabase db dump --linked --data-only -f data-backup.sql
```

**Pros:**
- Native support, no additional code
- Full schema + data
- Fast restore via `psql` or Supabase CLI

**Cons:**
- Requires Supabase CLI access
- SQL format (not human-readable)
- No selective table backups

---

### 2. Application-Level Backups (API-based)

**Enhanced Export API:**
- Extend `/api/export` to include ALL tables
- Support incremental exports (since last backup)
- Multiple formats: JSON, CSV, SQLite
- Compression support (gzip)

**Example:**
```typescript
GET /api/export?format=json&include=all&since=2026-01-29T00:00:00Z
GET /api/export?format=sqlite&include=tasks,comments,dependencies
```

**Pros:**
- Fine-grained control
- Portable formats
- Easy to inspect/edit
- Version control friendly (JSON in Git)

**Cons:**
- Need to maintain export logic
- Slower for large datasets
- Doesn't capture schema changes

---

### 3. Hybrid Approach (Recommended)

**Daily Schedule:**
1. **Supabase CLI Dump** (full schema) → S3/local storage
2. **API JSON Export** (data only) → Git repository
3. **Critical Data Export** (tasks + dependencies) → Multiple destinations

**Storage Targets:**
- Local VPS: `/root/jarvis-tasks-backups/`
- Git: Private GitHub repo (`jarvis-tasks-backups`)
- Cloud: S3-compatible storage (Backblaze B2, AWS S3, or Supabase Storage)

---

## 📦 Cloud Sync Options

### Option 1: Git-Based Sync (Recommended for Small/Medium Data)

**Setup:**
```bash
# Private GitHub repo for backups
git init /root/jarvis-tasks-backups
cd /root/jarvis-tasks-backups
git remote add origin git@github.com:diegodscamara/jarvis-tasks-backups.git

# Daily export + commit
curl https://jarvis-tasks.vercel.app/api/export?format=json > backup-$(date +%Y-%m-%d).json
git add .
git commit -m "Backup $(date +%Y-%m-%d)"
git push origin main
```

**Pros:**
- ✅ Free (private repos)
- ✅ Version history built-in
- ✅ Easy restore (just clone + import)
- ✅ Diff-friendly JSON

**Cons:**
- ❌ 100MB file limit per file
- ❌ Not ideal for large attachments

---

### Option 2: S3-Compatible Storage

**Recommended: Backblaze B2**
- $6/TB/month storage
- Free egress to Cloudflare
- S3-compatible API

**Setup:**
```bash
# Install rclone (not currently installed)
apt install rclone

# Configure B2
rclone config # Interactive setup

# Automated sync
rclone sync /root/jarvis-tasks-backups/ b2:jarvis-backups/
```

**Pros:**
- ✅ Unlimited size
- ✅ Cheap ($0.006/GB/month)
- ✅ Reliable

**Cons:**
- ❌ Costs money
- ❌ Requires setup

---

### Option 3: Supabase Storage

**Use Supabase's own object storage:**
```typescript
// Upload backup to Supabase Storage
const { data, error } = await supabase.storage
  .from('backups')
  .upload(`backup-${date}.json`, backupData)
```

**Pros:**
- ✅ Already integrated
- ✅ 1GB free storage
- ✅ Same region as database

**Cons:**
- ❌ Limited free tier
- ❌ Doesn't protect against Supabase outages

---

## 🛠️ Implementation Plan

### Phase 1: Enhanced Export API (Week 1)

**1.1 Extend Export Endpoint**

File: `src/app/api/export/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const format = searchParams.get('format') || 'json' // json, csv, sqlite
  const include = searchParams.get('include') || 'all' // all, tasks-only, core
  const since = searchParams.get('since') // ISO timestamp for incremental
  const compress = searchParams.get('compress') === 'true'
  
  // Fetch all tables based on 'include' parameter
  const tables = getTablesForBackup(include)
  
  // For incremental backups, filter by updated_at
  const exportData = await fetchAllData(tables, since)
  
  // Format output
  if (format === 'sqlite') {
    return generateSQLiteBackup(exportData)
  }
  
  if (compress) {
    return gzipResponse(exportData)
  }
  
  return jsonResponse(exportData)
}
```

**Tables to Export:**
- ✅ Core: tasks, projects, labels, task_labels
- ➕ Add: comments, task_links, task_dependencies
- ➕ Add: attachments (metadata only, not file content)
- ➕ Add: notifications, documents, logs (optional)
- ➕ Add: users (profiles only, not auth data)

**Export Metadata:**
```json
{
  "version": "2.0",
  "exportedAt": "2026-01-30T14:30:00Z",
  "format": "full",
  "incremental": false,
  "tables": ["tasks", "projects", ...],
  "recordCount": {
    "tasks": 156,
    "projects": 8,
    ...
  },
  "data": {
    "tasks": [...],
    "projects": [...]
  }
}
```

---

**1.2 Enhanced Import Endpoint**

File: `src/app/api/import/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { data, options } = await request.json()
  
  // Validation
  if (!data.version || data.version !== '2.0') {
    return json({ error: 'Invalid backup version' }, 400)
  }
  
  // Import strategy
  const strategy = options?.strategy || 'upsert' // upsert, replace, merge
  
  // Transaction wrapper for atomicity
  const result = await supabase.rpc('import_backup', {
    backup_data: data,
    strategy: strategy
  })
  
  return json({
    success: true,
    imported: result.imported,
    skipped: result.skipped,
    errors: result.errors
  })
}
```

**Import Strategies:**
- `upsert` - Update existing, insert new (default)
- `replace` - Clear DB, insert all (dangerous!)
- `merge` - Smart conflict resolution

---

### Phase 2: Backup Scheduling (Week 1-2)

**2.1 Server-Side Cron Job**

Create: `scripts/backup.sh`

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/root/jarvis-tasks-backups"
mkdir -p "$BACKUP_DIR"

# 1. Supabase CLI dump (full schema + data)
echo "📦 Creating Supabase dump..."
cd /root/jarvis-tasks
supabase db dump --linked -f "$BACKUP_DIR/schema-$DATE.sql"
supabase db dump --linked --data-only --use-copy -f "$BACKUP_DIR/data-$DATE.sql"

# 2. API JSON export (application data)
echo "📥 Exporting via API..."
curl -s "https://jarvis-tasks.vercel.app/api/export?format=json&include=all" \
  -o "$BACKUP_DIR/backup-$DATE.json"

# 3. Compress
echo "🗜️ Compressing..."
gzip "$BACKUP_DIR/data-$DATE.sql"
gzip "$BACKUP_DIR/backup-$DATE.json"

# 4. Git commit (optional)
if [ -d "$BACKUP_DIR/.git" ]; then
  cd "$BACKUP_DIR"
  git add .
  git commit -m "Backup $DATE" || true
  git push origin main || true
fi

# 5. Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.json.gz" -mtime +30 -delete

echo "✅ Backup complete: $BACKUP_DIR"
```

**Cron Setup:**
```bash
# Add to crontab
0 2 * * * /root/jarvis-tasks/scripts/backup.sh >> /var/log/jarvis-backup.log 2>&1
```

**Alternative: Systemd Timer**
```ini
# /etc/systemd/system/jarvis-backup.timer
[Unit]
Description=Jarvis Tasks Daily Backup

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

---

**2.2 Client-Side Export UI**

Create: `src/components/backup-panel.tsx`

```tsx
export function BackupPanel() {
  const [exporting, setExporting] = useState(false)
  
  const handleExport = async (format: 'json' | 'csv' | 'sqlite') => {
    setExporting(true)
    const res = await fetch(`/api/export?format=${format}&include=all`)
    const blob = await res.blob()
    downloadFile(blob, `jarvis-backup-${Date.now()}.${format}`)
    setExporting(false)
  }
  
  return (
    <div className="space-y-4">
      <h2>💾 Backup & Export</h2>
      
      <div className="flex gap-2">
        <Button onClick={() => handleExport('json')}>
          Export JSON
        </Button>
        <Button onClick={() => handleExport('csv')}>
          Export CSV
        </Button>
        <Button onClick={() => handleExport('sqlite')}>
          Export SQLite
        </Button>
      </div>
      
      <Button variant="outline" onClick={handleScheduledBackup}>
        ⏰ Schedule Daily Backup
      </Button>
    </div>
  )
}
```

---

### Phase 3: Restore Functionality (Week 2)

**3.1 Restore API Endpoint**

Create: `src/app/api/restore/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const strategy = formData.get('strategy') || 'upsert'
  
  // Parse backup file
  const content = await file.text()
  const backupData = JSON.parse(content)
  
  // Validate backup
  if (!backupData.version || !backupData.data) {
    return json({ error: 'Invalid backup file' }, 400)
  }
  
  // Restore data
  const result = await importBackup(backupData, strategy)
  
  return json({
    success: true,
    restored: result.restored,
    message: `Restored ${result.restored} records`
  })
}
```

**3.2 Restore UI**

```tsx
export function RestorePanel() {
  const [file, setFile] = useState<File | null>(null)
  const [restoring, setRestoring] = useState(false)
  
  const handleRestore = async () => {
    if (!file) return
    
    const confirmed = confirm(
      '⚠️ This will overwrite existing data. Continue?'
    )
    if (!confirmed) return
    
    setRestoring(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('strategy', 'upsert')
    
    const res = await fetch('/api/restore', {
      method: 'POST',
      body: formData
    })
    
    const result = await res.json()
    toast.success(`Restored ${result.restored} records`)
    setRestoring(false)
  }
  
  return (
    <div>
      <input 
        type="file" 
        accept=".json,.sql" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={handleRestore} disabled={!file || restoring}>
        🔄 Restore Backup
      </Button>
    </div>
  )
}
```

---

### Phase 4: Cloud Sync Integration (Week 2-3)

**4.1 Git-Based Sync (Immediate)**

```bash
# One-time setup
cd /root
git clone git@github.com:diegodscamara/jarvis-tasks-backups.git
cd jarvis-tasks-backups
echo "# Jarvis Tasks Backups" > README.md
git add .
git commit -m "Initial commit"
git push origin main
```

Update `scripts/backup.sh` to auto-commit (already included above).

**4.2 S3 Sync (Optional, for large deployments)**

```bash
# Install rclone
apt update && apt install rclone -y

# Configure Backblaze B2
rclone config
# Choose: Backblaze B2
# Enter account ID and application key
# Name: jarvis-b2

# Add to backup script
rclone sync /root/jarvis-tasks-backups/ jarvis-b2:jarvis-backups/ \
  --exclude ".git/**" \
  --log-file=/var/log/rclone-backup.log
```

**4.3 Supabase Storage Sync**

Create: `scripts/upload-to-supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function uploadBackup(filePath: string) {
  const fileName = path.basename(filePath)
  const fileContent = fs.readFileSync(filePath)
  
  const { data, error } = await supabase.storage
    .from('backups')
    .upload(`daily/${fileName}`, fileContent, {
      contentType: 'application/json',
      upsert: true
    })
  
  if (error) throw error
  console.log(`✅ Uploaded: ${fileName}`)
}

// Upload latest backup
const latestBackup = process.argv[2]
uploadBackup(latestBackup)
```

---

### Phase 5: Monitoring & Alerts (Week 3)

**5.1 Backup Health Check**

Create: `src/app/api/backup/status/route.ts`

```typescript
export async function GET() {
  const backupDir = '/root/jarvis-tasks-backups'
  
  // Check last backup time
  const files = fs.readdirSync(backupDir)
  const latestBackup = files
    .filter(f => f.endsWith('.json.gz'))
    .sort()
    .reverse()[0]
  
  const stats = fs.statSync(path.join(backupDir, latestBackup))
  const ageHours = (Date.now() - stats.mtimeMs) / 1000 / 60 / 60
  
  return json({
    status: ageHours < 48 ? 'healthy' : 'stale',
    lastBackup: stats.mtime,
    ageHours: ageHours,
    fileCount: files.length,
    totalSize: getTotalSize(backupDir)
  })
}
```

**5.2 Telegram/Discord Alerts**

```typescript
// Add to backup script
async function sendBackupAlert(status: 'success' | 'failed') {
  const message = status === 'success' 
    ? '✅ Daily backup completed successfully'
    : '🚨 Backup failed! Check logs.'
  
  await fetch(process.env.TELEGRAM_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
}
```

---

## 📋 UI Components Needed

### 1. Settings Page Section

Location: `src/app/settings/page.tsx`

Add new tab: **"Backup & Sync"**

**Components:**
- `<BackupPanel />` - Manual export/import
- `<ScheduleSettings />` - Configure backup frequency
- `<BackupHistory />` - List recent backups
- `<RestorePanel />` - Upload and restore backups
- `<SyncStatus />` - Show last sync time, health

### 2. Backup History Table

```tsx
interface Backup {
  id: string
  timestamp: Date
  size: number
  format: 'json' | 'sql'
  status: 'completed' | 'failed'
  recordCount: number
}

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Format</TableHead>
      <TableHead>Size</TableHead>
      <TableHead>Records</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {backups.map(backup => (
      <TableRow key={backup.id}>
        <TableCell>{formatDate(backup.timestamp)}</TableCell>
        <TableCell>{backup.format.toUpperCase()}</TableCell>
        <TableCell>{formatBytes(backup.size)}</TableCell>
        <TableCell>{backup.recordCount}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => downloadBackup(backup)}>
            Download
          </Button>
          <Button size="sm" onClick={() => restoreBackup(backup)}>
            Restore
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🔐 Security Considerations

1. **Encryption at Rest**
   - Encrypt backups with GPG before uploading
   - Store encryption key in 1Password

2. **Access Control**
   - Backup API endpoints require authentication
   - Supabase RLS policies for storage bucket

3. **Audit Trail**
   - Log all backup/restore operations to `logs` table
   - Track who triggered manual exports

4. **Sensitive Data**
   - Exclude `users.email` from public exports
   - Option to exclude certain tables (e.g., `logs`, `notifications`)

---

## 📊 Testing Plan

### Unit Tests
- Export API with different formats
- Import with conflict resolution
- Incremental backup logic

### Integration Tests
- End-to-end backup → restore cycle
- Cross-version compatibility
- Large dataset performance (10k+ tasks)

### Manual Testing Checklist
- ✅ Export JSON with all tables
- ✅ Export CSV (tasks only)
- ✅ Import backup (upsert mode)
- ✅ Import backup (replace mode)
- ✅ Incremental backup (since yesterday)
- ✅ Restore from 1-week-old backup
- ✅ Git sync push/pull
- ✅ S3 upload (if configured)
- ✅ Backup health check API
- ✅ UI download/upload workflow

---

## 📈 Success Metrics

1. **Reliability**: 100% backup success rate (daily cron)
2. **Coverage**: All tables included in backups
3. **Speed**: Export completes in <10 seconds for typical dataset
4. **Storage**: <100MB per backup (compressed)
5. **Recovery**: Can restore from backup in <2 minutes

---

## 🚀 Rollout Plan

### Week 1
- ✅ Extend export API to include all tables
- ✅ Add compression support
- ✅ Create backup script
- ✅ Set up daily cron job
- ✅ Create Git backup repository

### Week 2
- ✅ Implement restore API
- ✅ Build backup/restore UI components
- ✅ Add to Settings page
- ✅ Write tests

### Week 3
- ✅ Optional: Set up S3 sync
- ✅ Add monitoring/alerts
- ✅ Documentation
- ✅ User guide in docs/

---

## 📚 Documentation Needs

Create: `docs/backup-restore.md`

**Topics:**
1. How to manually export data
2. How to restore from backup
3. Setting up automated backups
4. Cloud sync options
5. Troubleshooting guide

---

## 🔮 Future Enhancements

1. **Differential Backups** - Only export changed records
2. **Backup Encryption** - GPG encryption for sensitive data
3. **Multi-Region Sync** - Replicate to multiple cloud providers
4. **Webhook Triggers** - Backup on critical events (e.g., 100+ tasks created)
5. **Backup Comparison Tool** - Diff two backups to see changes
6. **One-Click Rollback** - Restore to any point in time

---

## 💰 Cost Estimate

**Free Options:**
- GitHub (private repo): $0
- Supabase Storage (1GB): $0
- Daily cron on VPS: $0

**Paid Options (if needed):**
- Backblaze B2 (100GB): ~$0.60/month
- Supabase Storage (beyond 1GB): $0.021/GB/month
- AWS S3 (100GB): ~$2.30/month

**Recommended Start:** Free tier (Git + Supabase Storage)

---

## ✅ Checklist for Implementation

### Phase 1: Core Functionality
- [ ] Extend `/api/export` to include all tables
- [ ] Add compression (gzip) support
- [ ] Add incremental backup option
- [ ] Create `/api/import` with upsert/replace strategies
- [ ] Write unit tests for export/import

### Phase 2: Automation
- [ ] Create `scripts/backup.sh`
- [ ] Set up cron job for daily backups
- [ ] Configure Git repository for backups
- [ ] Test automated backup workflow

### Phase 3: UI
- [ ] Build `<BackupPanel />` component
- [ ] Build `<RestorePanel />` component
- [ ] Build `<BackupHistory />` table
- [ ] Add to Settings page
- [ ] Add success/error toasts

### Phase 4: Monitoring
- [ ] Create `/api/backup/status` endpoint
- [ ] Add Telegram/Discord alerts (optional)
- [ ] Create backup health dashboard

### Phase 5: Documentation
- [ ] Write user guide (`docs/backup-restore.md`)
- [ ] Update README with backup instructions
- [ ] Create troubleshooting guide

---

## 🎯 Conclusion

This plan provides a **comprehensive, production-ready backup and sync system** for Jarvis Tasks with:

1. ✅ **Multiple backup strategies** (SQL dumps + JSON exports)
2. ✅ **Automated scheduling** (daily cron jobs)
3. ✅ **Cloud sync options** (Git, S3, Supabase Storage)
4. ✅ **Easy restore** (API + UI)
5. ✅ **Monitoring & alerts** (health checks, notifications)

**Estimated Development Time:** 2-3 weeks  
**Maintenance Effort:** Low (automated backups run daily)  
**Cost:** $0 (using free tiers) to ~$1/month (with S3)

Ready to implement! 🚀
