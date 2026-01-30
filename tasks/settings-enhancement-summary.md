# Settings Enhancement - Research Summary
**Task ID:** 37c71403-2241-4a20-bb11-6d678644e1ca
**Date:** 2026-01-30

## Current State

### Existing Implementation
✅ Basic settings API at `/api/settings` (GET, PATCH, PUT)
✅ File-based storage (`data/settings.json`)
✅ localStorage persistence in frontend
✅ Theme system with 5 themes (dark, light, midnight, linear-purple, linear-blue)
✅ Keyboard shortcuts (hardcoded)
✅ Export/Import functionality exists
✅ Telegram notifier class (partial implementation)
✅ Database has `users.preferences` JSONB column (unused)

### Gap Analysis
❌ No centralized settings UI
❌ Settings scattered across code
❌ No notification preferences management
❌ No integration configuration UI
❌ No keyboard shortcut reference
❌ Limited data management controls

## Proposed Solution

### 6 Main Settings Categories

1. **Appearance** (Theme, colors, density, font size, default view)
2. **User Preferences** (Defaults, date/time formats, auto-save)
3. **Notifications** (Types, Telegram, desktop, email, sound)
4. **Keyboard Shortcuts** (Reference, enable/disable, future customization)
5. **Integrations** (GitHub, webhooks, Clawdbot, API keys)
6. **Data Management** (Export, import, backup, danger zone)

### UI Approach
- **Sidebar navigation** (like Linear/GitHub)
- Settings modal/page accessible via:
  - Gear icon in header
  - Command palette (Cmd+K)
  - Keyboard shortcut (`,`)

### Storage Strategy
Three-tier approach:
1. **localStorage** - Instant cache
2. **File storage** - Current fallback (phase out)
3. **Supabase users.preferences** - Multi-device sync

## Implementation Plan

### Phase 1: Core UI (Week 1)
- Settings page with sidebar navigation
- Appearance & User Preferences sections
- Reusable setting components
- Expanded API types

**Components:**
- `src/app/settings/page.tsx`
- `src/components/settings/` directory
- Updated `/api/settings` endpoint

### Phase 2: Notifications & Keyboard (Week 2)
- Notification preferences UI
- Telegram integration controls
- Keyboard shortcuts reference
- Desktop notification permissions

### Phase 3: Integrations & Data (Week 3)
- GitHub connection UI
- Webhook management
- API key generation
- Enhanced export/import
- Danger zone actions

### Phase 4: Polish (Week 4)
- Search in settings
- Mobile optimization
- Accessibility improvements
- Testing & documentation

## Key Technical Decisions

1. **Nested settings structure** (not flat)
   ```typescript
   {
     appearance: { theme, colors, ... },
     preferences: { defaults, formats, ... },
     notifications: { types, integrations, ... },
     // etc.
   }
   ```

2. **Zod validation** for all settings
3. **Optimistic updates** with debouncing
4. **Migration path** from old flat structure
5. **Security-first** for sensitive tokens

## Files to Create (Core)
```
src/app/settings/
├── page.tsx
├── layout.tsx
└── [...section]/page.tsx

src/components/settings/
├── settings-sidebar.tsx
├── setting-row.tsx
├── setting-toggle.tsx
├── setting-select.tsx
├── setting-color-picker.tsx
└── [20+ components]

src/lib/
└── settings-schema.ts

src/types/
└── settings.ts
```

## Dependencies
- ✅ All required UI components exist (Radix)
- New: `react-colorful` for color picker
- Use existing: `zod`, all Radix components

## Security Measures
- Telegram tokens in environment only
- GitHub OAuth flow
- API keys hashed before storage
- Webhook signature validation
- Never expose secrets to frontend

## Testing Strategy
- Unit tests for schema validation
- Integration tests for API endpoints
- E2E tests for user flows (Playwright)
- Manual accessibility audit

## Success Metrics
- Settings load < 500ms
- Save operations < 100ms
- Zero data loss during migration
- 80%+ user engagement with settings

## Risks & Mitigations
- **Data loss:** Backup before migration
- **Performance:** Lazy loading, code splitting
- **Security:** Env vars only, encryption
- **Complexity:** Progressive disclosure, good defaults

## Next Steps
1. ✅ Research complete
2. ⏭️ Review this plan with Diego
3. Create detailed Speckit specification
4. Break into subtasks in Jarvis Tasks
5. Begin Phase 1 implementation

## Full Plan Location
📄 `/root/jarvis-tasks/specs/settings-enhancement-plan.md` (30KB, 600+ lines)

## Estimated Timeline
**4 weeks to MVP** (detailed breakdown in full plan)

---
**Status:** ✅ Planning Complete - Ready for Implementation
