# Settings Enhancement Plan
**Task ID:** 37c71403-2241-4a20-bb11-6d678644e1ca
**Created:** 2026-01-30
**Status:** Planning Phase

## Executive Summary
Design and implement a comprehensive settings system for Jarvis Tasks that consolidates user preferences, integrations, and data management into a cohesive UI with proper persistence strategy.

---

## Current State Analysis

### Existing Settings Implementation
1. **File-based storage** (`data/settings.json`)
   - Located: `/src/app/api/settings/route.ts`
   - Supports: GET, PATCH, PUT
   - Default settings stored in API route

2. **localStorage usage** (frontend)
   - Key: `jarvis-tasks-settings`
   - Stores: defaultAssignee, showCompletedTasks, compactView, theme, accentColor
   - Location: `src/app/page.tsx`

3. **Database schema**
   - `users` table has `preferences` JSONB column (unused)
   - Could support per-user settings with authentication

4. **Theme system**
   - Multiple themes: dark, light, midnight, linear-purple, linear-blue
   - Theme provider with localStorage persistence
   - Location: `src/lib/theme.ts`, `src/components/theme-provider.tsx`

5. **Existing features that need settings**
   - Keyboard shortcuts (currently hardcoded)
   - Telegram notifications (env-based config)
   - Webhook integrations (partial)
   - Export/Import functionality (exists but not in settings)

### Current Settings in DEFAULT_SETTINGS
```typescript
{
  theme: 'dark',
  accentColor: '#5E6AD2',
  fontSize: 'medium',
  compactMode: false,
  showCompletedTasks: true,
  defaultView: 'board',
  notificationsEnabled: true,
  soundEffects: false,
  keyboardShortcuts: true,
  autoSave: true,
  dateFormat: 'relative',
  weekStartsOn: 1, // Monday
  defaultProject: null,
  defaultPriority: 'medium',
}
```

---

## Settings Categories & Features

### 1. Appearance Settings
**Goal:** Customize visual experience

#### Options:
- **Theme** (dropdown)
  - Light
  - Dark
  - Midnight
  - Linear Purple
  - Linear Blue
  
- **Accent Color** (color picker)
  - Predefined palette: Blue, Purple, Green, Orange, Pink, Cyan, Red
  - Custom color picker option
  
- **View Density** (radio buttons)
  - Compact
  - Comfortable (default)
  - Spacious
  
- **Font Size** (slider)
  - Small (12px)
  - Medium (14px) - default
  - Large (16px)
  - Extra Large (18px)
  
- **Default View** (dropdown)
  - Board (Kanban)
  - List
  - Calendar

#### Storage:
- Frontend: localStorage for instant application
- Backend: settings.json for persistence
- Database: users.preferences for multi-device sync (future)

---

### 2. User Preferences
**Goal:** Control default behavior and workflows

#### Options:
- **Default Assignee** (dropdown)
  - Jarvis (Claude)
  - Gemini
  - Copilot
  - Claude Direct
  - Diego
  
- **Default Priority** (dropdown)
  - Low
  - Medium (default)
  - High
  
- **Default Project** (dropdown)
  - None (default)
  - [List of existing projects]
  
- **Show Completed Tasks** (toggle)
  - Default: On
  
- **Auto-save** (toggle)
  - Default: On
  - Interval setting (5s, 10s, 30s)
  
- **Date Format** (radio)
  - Relative ("2 days ago")
  - Absolute ("Jan 28, 2026")
  - ISO 8601 ("2026-01-28")
  
- **Week Starts On** (dropdown)
  - Sunday
  - Monday (default)
  
- **Time Format** (radio)
  - 12-hour (AM/PM)
  - 24-hour

---

### 3. Notifications
**Goal:** Configure how and when to receive updates

#### Options:
- **Enable Notifications** (master toggle)
  - Default: On
  
- **Notification Types** (individual toggles)
  - Task assigned to you
  - Task due soon (< 24h)
  - Task overdue
  - Comment on your task
  - Task completed
  - Daily summary (time picker)
  
- **Telegram Integration**
  - Enable Telegram notifications (toggle)
  - Channel ID (text input)
  - Bot Token (password input)
  - Test notification (button)
  
- **Desktop Notifications** (toggle)
  - Browser permission status
  - Request permission button
  
- **Email Notifications** (future)
  - Digest frequency: Real-time, Daily, Weekly
  
- **Sound Effects** (toggle)
  - Default: Off
  - Volume slider (if enabled)

#### Implementation Notes:
- Use existing TelegramNotifier class
- Store sensitive tokens in environment variables
- UI only for enabling/disabling

---

### 4. Keyboard Shortcuts
**Goal:** View and customize keyboard shortcuts

#### Layout:
- **Enable Keyboard Shortcuts** (master toggle)
  - Default: On

- **Shortcut Reference** (read-only for MVP)
  - Navigation section
  - Actions section
  - Quick filters section
  
- **Customization** (Phase 2)
  - Click to rebind
  - Conflict detection
  - Reset to defaults

#### Current Shortcuts:
```
Navigation:
  a - All Issues
  1 - Backlog
  2 - To Do
  3 - In Progress
  4 - Done

Actions:
  c - Create task
  j - Next task
  k - Previous task
  Enter - Open task
  g - First task
  G - Last task
  Esc - Close dialog
  / - Search
  ? - Show help
  Cmd/Ctrl+K - Command palette
```

---

### 5. Integrations
**Goal:** Connect external tools and services

#### GitHub Integration
- **Enable GitHub Sync** (toggle)
  - Repository (text input)
  - Access token (password input, use 1Password)
  - Auto-create tasks from issues (toggle)
  - Auto-link PRs (toggle)
  - Status: Connected/Disconnected (indicator)
  - Test connection (button)

#### Telegram Bot
- See Notifications section

#### Webhooks
- **Incoming Webhooks**
  - Enable (toggle)
  - Webhook URL (read-only, with copy button)
  - Secret key (password, regenerate button)
  - Event types to trigger
  
- **Outgoing Webhooks** (Phase 2)
  - Add webhook endpoint
  - Events to send: created, updated, completed, deleted
  - Headers (key-value pairs)
  - Test webhook (button)

#### Clawdbot Integration
- **Enable Clawdbot Commands** (toggle)
  - Webhook endpoint (auto-configured)
  - Allowed commands list
  - Status indicator

#### API Access
- **API Key Management**
  - Generate new API key (button)
  - Active keys list (with revoke option)
  - Last used timestamp
  - Read-only/Read-write scope

---

### 6. Data Management
**Goal:** Import, export, backup, and delete data

#### Export
- **Export Format** (radio)
  - JSON (full structure)
  - CSV (tasks only)
  
- **Include** (checkboxes)
  - ✓ Tasks
  - ✓ Projects
  - ✓ Labels
  - ✓ Comments
  - ✓ Settings
  
- **Export Button**
  - Downloads file: `jarvis-tasks-export-YYYY-MM-DD.{json|csv}`
  - Uses existing `/api/export` endpoint

#### Import
- **Import File** (file upload)
  - Accepts: .json, .csv
  - Validation before import
  - Preview changes (show count of new/updated items)
  
- **Conflict Resolution** (radio)
  - Skip duplicates
  - Overwrite existing
  - Create copies
  
- **Import Button**
  - Uses existing `/api/import` endpoint
  - Shows progress bar
  - Success/error summary

#### Backup & Sync (Phase 2)
- **Auto-backup** (toggle)
  - Frequency: Daily, Weekly, Monthly
  - Storage: Local, Cloud (Supabase storage)
  
- **Restore from Backup**
  - List available backups
  - Restore point selection

#### Danger Zone
- **Clear Completed Tasks** (button)
  - Confirmation dialog
  - Optional: Archive instead of delete
  
- **Reset Settings** (button)
  - Restore all settings to defaults
  - Confirmation dialog
  
- **Delete All Data** (button)
  - Requires typing confirmation phrase
  - Irreversible warning
  - Export backup first prompt

---

## UI/UX Design

### Settings Page Layout

#### Option A: Sidebar Navigation (Recommended)
```
┌─────────────────────────────────────────┐
│ ⚙️  Settings                     [×]    │
├──────────┬──────────────────────────────┤
│          │                              │
│ General  │  Theme Preferences           │
│ Appear.  │  ┌──────────────────────┐   │
│ Notifs   │  │ Dark     [Selected]  │   │
│ Keyboard │  │ Light                │   │
│ Integr.  │  │ Midnight             │   │
│ Data     │  └──────────────────────┘   │
│          │                              │
│          │  Accent Color                │
│          │  [Color Picker]              │
│          │                              │
│          │                  [Save]      │
└──────────┴──────────────────────────────┘
```

**Pros:**
- Familiar pattern (GitHub, Linear, Notion)
- Easy to navigate many settings
- Good for future expansion
- Clear categorization

#### Option B: Tabbed Interface
```
┌─────────────────────────────────────────┐
│ ⚙️  Settings                     [×]    │
├─────────────────────────────────────────┤
│ General│Appearance│Notifs│...           │
├─────────────────────────────────────────┤
│                                         │
│  Theme Preferences                      │
│  ┌────────────────┐                    │
│  │ Dark [Selected]│                    │
│  └────────────────┘                    │
│                              [Save]     │
└─────────────────────────────────────────┘
```

**Pros:**
- Simpler for fewer categories
- Compact header
- Mobile-friendly

**Recommendation:** Option A (Sidebar) - More scalable and matches Linear's design language

### Access Points
1. **Settings icon in header** (primary)
   - Gear icon button
   - Opens settings modal/page
   
2. **Command Palette** (Cmd+K)
   - Add "Settings" command
   - Quick jump to specific sections
   
3. **Keyboard shortcut**
   - `,` (comma) - common pattern
   - Shift+, for specific section

### Component Design

#### Toggle with Description
```
Enable Notifications           [ON]
Send browser notifications when tasks 
are assigned or due.
```

#### Color Picker
- Predefined palette grid
- Custom color input (hex)
- Live preview

#### Input with Validation
```
Telegram Bot Token     [•••••••]  [Test]
✓ Token verified
```

#### Danger Actions
```
┌─────────────────────────────────────┐
│ ⚠️  Danger Zone                     │
│                                     │
│ Delete All Data      [Delete...]   │
│ This action cannot be undone.      │
└─────────────────────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Core Settings UI (Week 1)

#### Tasks:
1. **Create Settings Page Component**
   - File: `src/app/settings/page.tsx`
   - Sidebar navigation
   - Section routing

2. **Create Setting Components**
   - `SettingsSection` wrapper
   - `SettingRow` (label + control)
   - `SettingToggle`, `SettingSelect`, `SettingInput`
   - `SettingColorPicker`
   - Location: `src/components/settings/`

3. **Implement Appearance Settings**
   - Theme selector
   - Accent color picker
   - View density
   - Font size

4. **Implement User Preferences**
   - Default assignee
   - Default priority/project
   - Date/time formats
   - Show completed toggle

5. **Update Settings API**
   - Expand `/api/settings` types
   - Add validation
   - Add migration for new fields

#### Files to Create:
```
src/app/settings/
├── page.tsx              # Main settings page
├── layout.tsx            # Settings layout with sidebar
└── [...section]/
    └── page.tsx          # Dynamic section routing

src/components/settings/
├── index.ts
├── settings-sidebar.tsx
├── settings-section.tsx
├── setting-row.tsx
├── setting-toggle.tsx
├── setting-select.tsx
├── setting-input.tsx
├── setting-color-picker.tsx
└── danger-zone.tsx

src/lib/
└── settings-schema.ts    # Zod validation schemas

src/types/
└── settings.ts           # TypeScript types
```

#### Files to Modify:
```
src/app/page.tsx          # Add settings link
src/components/ui/        # Ensure all needed components exist
src/lib/constants.ts      # Expand DEFAULT_SETTINGS
src/app/api/settings/route.ts  # Add new fields
```

---

### Phase 2: Notifications & Keyboard (Week 2)

#### Tasks:
1. **Notifications Settings**
   - Master toggle
   - Individual notification types
   - Telegram integration UI
   - Desktop notification permissions

2. **Keyboard Shortcuts**
   - Reference display (read-only)
   - Enable/disable toggle
   - Future: Customization interface

3. **Hook Settings to Features**
   - Update TelegramNotifier to read settings
   - Add notification preference checks
   - Keyboard shortcuts respecting settings

#### Files to Create:
```
src/components/settings/
├── notification-settings.tsx
├── telegram-test-button.tsx
└── keyboard-reference.tsx

src/lib/
└── notification-preferences.ts
```

#### Files to Modify:
```
src/lib/telegram-notifier.ts  # Read from settings
src/app/page.tsx              # Check keyboard settings
```

---

### Phase 3: Integrations & Data (Week 3)

#### Tasks:
1. **Integration Settings**
   - GitHub connection UI
   - Webhook management
   - API key generation
   - Status indicators

2. **Data Management**
   - Export improvements (include settings)
   - Import UI with preview
   - Backup/restore interface
   - Danger zone actions

3. **Settings Sync**
   - Migrate to Supabase users.preferences
   - Multi-device sync
   - Conflict resolution

#### Files to Create:
```
src/components/settings/
├── github-integration.tsx
├── webhook-manager.tsx
├── api-key-manager.tsx
├── export-settings.tsx
└── import-settings.tsx

src/app/api/settings/
├── github/route.ts
├── webhooks/route.ts
└── api-keys/route.ts
```

#### Files to Modify:
```
src/app/api/export/route.ts   # Include settings in export
src/app/api/import/route.ts   # Handle settings import
supabase/migrations/          # Add settings tables if needed
```

---

### Phase 4: Polish & Advanced (Week 4)

#### Tasks:
1. **Search in Settings**
   - Cmd+K to search settings
   - Highlight matches
   - Jump to section

2. **Settings Presets**
   - "Minimal", "Power User", "Team Lead"
   - One-click theme bundles

3. **Change History**
   - Track setting changes
   - Undo recent changes
   - Audit log (for teams)

4. **Mobile Optimization**
   - Responsive layout
   - Touch-friendly controls
   - Bottom sheet on mobile

5. **Accessibility**
   - Keyboard navigation
   - Screen reader labels
   - High contrast mode

---

## Data Storage Strategy

### Three-Tier Approach:

#### 1. localStorage (Frontend Cache)
**Purpose:** Instant UI updates, offline access
**Stores:** All settings
**Format:**
```typescript
interface LocalSettings {
  version: string
  lastSync: string
  settings: SettingsObject
}
```

#### 2. File Storage (Current: data/settings.json)
**Purpose:** Fallback, single-user deployments
**Stores:** All settings
**Migration:** Phase out in favor of database

#### 3. Database (Supabase: users.preferences)
**Purpose:** Multi-user, multi-device sync
**Stores:** Per-user settings
**Schema:**
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

CREATE INDEX idx_users_preferences ON users 
USING gin(preferences);
```

### Sync Strategy:
1. Read from localStorage on load (fast)
2. Fetch from database in background
3. Merge and resolve conflicts
4. Save to all locations on change
5. Debounce writes (1s delay)

### Conflict Resolution:
- Last-write-wins for simple values
- Merge arrays/objects intelligently
- User prompt for critical conflicts
- "Restore from cloud" option

---

## Settings Schema (TypeScript)

```typescript
// src/types/settings.ts

export interface AppearanceSettings {
  theme: ThemeVariant
  accentColor: string
  viewDensity: 'compact' | 'comfortable' | 'spacious'
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  defaultView: 'board' | 'list' | 'calendar'
}

export interface UserPreferences {
  defaultAssignee: Agent
  defaultPriority: Priority
  defaultProject: string | null
  showCompletedTasks: boolean
  autoSave: boolean
  autoSaveInterval: 5 | 10 | 30
  dateFormat: 'relative' | 'absolute' | 'iso'
  timeFormat: '12h' | '24h'
  weekStartsOn: 0 | 1 // Sunday | Monday
  language: string // 'en', 'es', 'pt', etc.
  timezone: string // IANA timezone
}

export interface NotificationSettings {
  enabled: boolean
  types: {
    taskAssigned: boolean
    taskDueSoon: boolean
    taskOverdue: boolean
    taskComment: boolean
    taskCompleted: boolean
    dailySummary: boolean
  }
  dailySummaryTime: string // HH:mm format
  telegram: {
    enabled: boolean
    channelId: string
    botToken: string // Stored in env, not here
    verified: boolean
  }
  desktop: {
    enabled: boolean
    permissionGranted: boolean
  }
  email: {
    enabled: boolean
    digest: 'realtime' | 'daily' | 'weekly'
  }
  soundEffects: boolean
  soundVolume: number // 0-100
}

export interface KeyboardSettings {
  enabled: boolean
  shortcuts: Record<string, string> // action -> key binding
  customBindings: Record<string, string> // Phase 2
}

export interface IntegrationSettings {
  github: {
    enabled: boolean
    repository: string
    accessToken: string // Stored securely
    autoCreateTasks: boolean
    autoLinkPRs: boolean
    connected: boolean
  }
  webhooks: {
    incoming: {
      enabled: boolean
      url: string // Auto-generated
      secretKey: string // Auto-generated
      events: string[]
    }
    outgoing: Array<{
      id: string
      name: string
      url: string
      events: string[]
      headers: Record<string, string>
      enabled: boolean
    }>
  }
  clawdbot: {
    enabled: boolean
    webhookUrl: string
    allowedCommands: string[]
  }
  api: {
    keys: Array<{
      id: string
      name: string
      key: string
      scope: 'readonly' | 'readwrite'
      createdAt: string
      lastUsed: string | null
    }>
  }
}

export interface DataSettings {
  backup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    storage: 'local' | 'cloud'
    lastBackup: string | null
  }
}

export interface Settings {
  version: string
  appearance: AppearanceSettings
  preferences: UserPreferences
  notifications: NotificationSettings
  keyboard: KeyboardSettings
  integrations: IntegrationSettings
  data: DataSettings
  _meta: {
    createdAt: string
    updatedAt: string
    lastSync: string | null
  }
}
```

---

## Validation & Defaults

### Zod Schema

```typescript
// src/lib/settings-schema.ts

import { z } from 'zod'

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['default', 'dark', 'light', 'midnight', 'linear-purple', 'linear-blue']),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  viewDensity: z.enum(['compact', 'comfortable', 'spacious']),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  defaultView: z.enum(['board', 'list', 'calendar']),
})

export const userPreferencesSchema = z.object({
  defaultAssignee: z.enum(['jarvis', 'gemini', 'copilot', 'claude', 'diego']),
  defaultPriority: z.enum(['low', 'medium', 'high']),
  defaultProject: z.string().nullable(),
  showCompletedTasks: z.boolean(),
  autoSave: z.boolean(),
  autoSaveInterval: z.enum([5, 10, 30]),
  dateFormat: z.enum(['relative', 'absolute', 'iso']),
  timeFormat: z.enum(['12h', '24h']),
  weekStartsOn: z.enum([0, 1]),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
})

// ... more schemas

export const settingsSchema = z.object({
  version: z.string(),
  appearance: appearanceSettingsSchema,
  preferences: userPreferencesSchema,
  notifications: notificationSettingsSchema,
  keyboard: keyboardSettingsSchema,
  integrations: integrationSettingsSchema,
  data: dataSettingsSchema,
  _meta: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    lastSync: z.string().nullable(),
  }),
})

export const DEFAULT_SETTINGS: Settings = {
  version: '1.0.0',
  appearance: {
    theme: 'dark',
    accentColor: '#5E6AD2',
    viewDensity: 'comfortable',
    fontSize: 'medium',
    defaultView: 'board',
  },
  preferences: {
    defaultAssignee: 'jarvis',
    defaultPriority: 'medium',
    defaultProject: null,
    showCompletedTasks: true,
    autoSave: true,
    autoSaveInterval: 10,
    dateFormat: 'relative',
    timeFormat: '12h',
    weekStartsOn: 1,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  notifications: {
    enabled: true,
    types: {
      taskAssigned: true,
      taskDueSoon: true,
      taskOverdue: true,
      taskComment: true,
      taskCompleted: false,
      dailySummary: false,
    },
    dailySummaryTime: '09:00',
    telegram: {
      enabled: false,
      channelId: '',
      botToken: '',
      verified: false,
    },
    desktop: {
      enabled: false,
      permissionGranted: false,
    },
    email: {
      enabled: false,
      digest: 'daily',
    },
    soundEffects: false,
    soundVolume: 50,
  },
  keyboard: {
    enabled: true,
    shortcuts: {
      // Default shortcuts mapping
      createTask: 'c',
      search: '/',
      help: '?',
      commandPalette: 'cmd+k',
      // ... more
    },
    customBindings: {},
  },
  integrations: {
    github: {
      enabled: false,
      repository: '',
      accessToken: '',
      autoCreateTasks: false,
      autoLinkPRs: true,
      connected: false,
    },
    webhooks: {
      incoming: {
        enabled: false,
        url: '',
        secretKey: '',
        events: [],
      },
      outgoing: [],
    },
    clawdbot: {
      enabled: true,
      webhookUrl: '',
      allowedCommands: ['create', 'update', 'search', 'remind'],
    },
    api: {
      keys: [],
    },
  },
  data: {
    backup: {
      enabled: false,
      frequency: 'weekly',
      storage: 'local',
      lastBackup: null,
    },
  },
  _meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSync: null,
  },
}
```

---

## API Endpoints

### Existing:
- `GET /api/settings` - Fetch settings
- `PATCH /api/settings` - Update partial
- `PUT /api/settings` - Replace all

### New Endpoints Needed:

#### Settings Management
- `GET /api/settings/schema` - Get JSON schema for validation
- `POST /api/settings/reset` - Reset to defaults
- `GET /api/settings/export` - Export settings as JSON
- `POST /api/settings/import` - Import settings from JSON

#### Integrations
- `POST /api/settings/telegram/test` - Send test notification
- `POST /api/settings/github/connect` - Verify GitHub connection
- `POST /api/settings/github/disconnect` - Revoke access
- `POST /api/settings/webhooks` - Create new webhook
- `DELETE /api/settings/webhooks/:id` - Delete webhook
- `POST /api/settings/webhooks/:id/test` - Test webhook
- `POST /api/settings/api-keys` - Generate new API key
- `DELETE /api/settings/api-keys/:id` - Revoke API key

#### Notifications
- `POST /api/settings/notifications/test` - Test notification

---

## Security Considerations

### Sensitive Data
1. **Telegram Bot Token**
   - Store in environment variables
   - Never expose in frontend
   - UI only shows masked value
   - Test button uses backend API

2. **GitHub Access Token**
   - Store encrypted in database
   - Use OAuth flow (preferred)
   - Scopes: repo (read), issues (write)

3. **Webhook Secret Keys**
   - Auto-generated UUIDs
   - Validate HMAC signatures
   - Rotate on demand

4. **API Keys**
   - Generate with crypto.randomBytes
   - Hash before storing (bcrypt/argon2)
   - Rate limit per key
   - Audit log usage

### Permissions
- Settings require authentication (Phase 2)
- Team admins can lock certain settings
- Workspace-level vs user-level settings

---

## Testing Plan

### Unit Tests
- Settings schema validation
- Default value generation
- Merge/conflict resolution logic
- Storage persistence

### Integration Tests
- API endpoints (CRUD)
- Telegram notification sending
- GitHub connection flow
- Webhook delivery

### E2E Tests (Playwright)
```
settings.spec.ts
├── Can open settings page
├── Can change theme and persist
├── Can update default assignee
├── Can enable/disable notifications
├── Can test Telegram connection
├── Can export settings
├── Can import settings
├── Can reset to defaults
└── Can navigate between sections
```

### Manual Testing Checklist
- [ ] All toggles work
- [ ] Color picker updates live
- [ ] Settings persist after refresh
- [ ] Settings sync across tabs
- [ ] Import/export round-trip
- [ ] Telegram test sends message
- [ ] Keyboard shortcuts respect settings
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard nav, screen reader)

---

## Migration Strategy

### v1.0.0 → v1.1.0 (Settings Enhancement)

#### Data Migration:
1. **Detect old settings format**
   ```typescript
   if (!settings.version || settings.version < '1.1.0') {
     migrateSettings()
   }
   ```

2. **Migrate flat structure to nested**
   ```typescript
   {
     theme: 'dark',        → appearance.theme
     accentColor: '...',   → appearance.accentColor
     defaultAssignee: '...' → preferences.defaultAssignee
     // etc.
   }
   ```

3. **Add new defaults for missing fields**
   ```typescript
   const migrated = {
     ...DEFAULT_SETTINGS,
     ...transformOldSettings(oldSettings)
   }
   ```

4. **Save migrated settings**
   - Update localStorage
   - Update file storage
   - Save to database (if enabled)

#### UI Migration:
1. Show "Settings upgraded!" toast
2. Optional: Show changelog/what's new
3. Offer tour of new settings

---

## Performance Optimization

### Lazy Loading
- Settings sections load on demand
- Heavy components (color picker) are dynamic imports

### Debouncing
- Text inputs: 500ms debounce
- Toggles/selects: Immediate save
- Batch updates to reduce API calls

### Caching
- Cache settings in React Context
- Only refetch on tab focus if stale (>5min)
- Optimistic updates for instant feedback

### Bundle Size
- Code-split settings page
- Use dynamic imports for section components
- Tree-shake unused integrations

---

## Accessibility

### Keyboard Navigation
- Tab through all controls
- Arrow keys in radio groups
- Escape to close modals
- Focus management

### Screen Reader
- Proper ARIA labels
- Role attributes
- Live regions for status updates
- Descriptive button text

### Color Contrast
- WCAG AA compliance minimum
- High contrast mode option
- Test with color blindness simulators

### Focus Indicators
- Visible focus rings
- Consistent focus styles
- Skip to section links

---

## Documentation

### User Documentation
- Settings reference guide
- Integration setup tutorials
- Keyboard shortcuts cheat sheet
- FAQ for common issues

### Developer Documentation
- Settings schema documentation
- API endpoint specs (OpenAPI)
- Component storybook
- Migration guide

---

## Success Metrics

### User Engagement
- % of users who visit settings
- Most changed settings (heatmap)
- Time to complete setup
- Abandonment rate

### Feature Adoption
- Telegram integration usage
- Keyboard shortcuts enabled
- Custom themes created
- Export/import usage

### Performance
- Settings page load time < 500ms
- Save operation time < 100ms
- Zero data loss incidents

---

## Future Enhancements (Post-MVP)

### Phase 5+
1. **Team Settings**
   - Workspace-level defaults
   - Role-based permissions
   - Setting templates

2. **Advanced Customization**
   - Custom CSS themes
   - Plugin system
   - Workflow automation

3. **AI-Powered Settings**
   - Smart defaults based on usage
   - Setting recommendations
   - "Optimize my workspace" button

4. **Mobile App Settings**
   - Native iOS/Android settings
   - Sync with web
   - Device-specific overrides

5. **Analytics Dashboard**
   - Settings usage stats
   - Team comparisons
   - Performance insights

---

## Open Questions

1. **Should settings be user-scoped or workspace-scoped?**
   - Decision: User-scoped for MVP, workspace in Phase 2

2. **Store Telegram token in database or env only?**
   - Decision: Environment variables only for security

3. **Allow custom keyboard shortcuts in MVP?**
   - Decision: No, read-only reference. Phase 2 feature.

4. **Support multiple Telegram channels?**
   - Decision: Single channel for MVP. Array in Phase 2.

5. **Settings search vs table of contents?**
   - Decision: Both. TOC for browsing, search for specific settings.

---

## Dependencies

### New NPM Packages
- `react-colorful` - Color picker component
- `@radix-ui/react-slider` - Already installed
- `@radix-ui/react-radio-group` - Already installed
- `zod` - Already installed

### Existing Components to Use
- Dialog (settings modal)
- Switch (toggles)
- Select (dropdowns)
- Input (text fields)
- Button (actions)
- Tabs (sections on mobile)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup before migration, rollback plan |
| Performance degradation | Medium | Lazy load, debounce, optimize bundle |
| Security breach (tokens) | High | Never store in frontend, encrypt at rest |
| User confusion (too many options) | Medium | Progressive disclosure, good defaults |
| Breaking changes to API | High | Version API, deprecation warnings |

---

## Approval & Sign-off

### Stakeholders
- **Product Owner:** Diego
- **Developer:** Jarvis (Claude)
- **Reviewer:** TBD

### Checklist Before Implementation
- [ ] Plan reviewed and approved
- [ ] UI mockups created
- [ ] API schema finalized
- [ ] Database migration planned
- [ ] Test plan documented
- [ ] Security review completed
- [ ] Accessibility audit scheduled

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | Week 1 | Core UI & Appearance/Preferences |
| Phase 2 | Week 2 | Notifications & Keyboard Reference |
| Phase 3 | Week 3 | Integrations & Data Management |
| Phase 4 | Week 4 | Polish, Testing, Documentation |

**Total:** 4 weeks to MVP
**Launch:** End of Week 4

---

## Conclusion

This plan outlines a comprehensive settings system that:
- ✅ Consolidates all configuration in one place
- ✅ Provides excellent UX with familiar patterns
- ✅ Scales for future features
- ✅ Maintains security and performance
- ✅ Enables powerful integrations
- ✅ Empowers users to customize their workflow

**Next Steps:**
1. Review and approve this plan
2. Create Speckit specification
3. Break down into subtasks in Jarvis Tasks
4. Begin Phase 1 implementation

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ✅ Planning Complete - Ready for Review
