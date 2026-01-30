# Docs Page Feature Specification

## Overview
A dedicated documentation hub within Jarvis Task Manager to store and organize all important documentation, guidelines, and reports related to the Jarvis AI system.

## User Story
As Diego, I want a centralized place to access all Jarvis-related documentation, guidelines, reports, and operational notes so that I can quickly reference important information without searching across multiple locations.

## Features

### 1. Docs Listing Page (`/docs`)
- **Grid/List View**: Toggle between grid and list layouts
- **Categories/Tags**: 
  - Guidelines (Guardrails, Brews, Orchestration)
  - Memory System (MEMORY.md, daily logs, project memories)
  - Reports (Security audits, vulnerability reports, code review summaries)
  - Daily Operations (AI polls, sync summaries, email monitoring notes)
  - Agent Documentation (Sub-agent behaviors, patterns)
  - System Documentation (API docs, config docs)
- **Search**: Full-text search across all documents
- **Filters**: By category, tag, date range, author
- **Quick Actions**: Create new doc, import from memory, upload file

### 2. Doc Detail View
- **Rich Text Editor**: For editing documentation
- **Markdown Support**: Full markdown rendering and editing
- **Metadata Display**: Created date, last modified, tags, category
- **Version History**: Track changes over time
- **Related Docs**: Link related documents
- **Export Options**: Download as Markdown, PDF, or copy to clipboard
- **Tags**: Add/remove tags for categorization

### 3. Doc Creation/Edit
- **Title**: Document title
- **Content**: Rich text/Markdown editor
- **Category**: Select from predefined categories
- **Tags**: Multi-select tags
- **Source**: Indicate where content came from (manual, memory import, automated)
- **Visibility**: Public (accessible to shared contexts) or private

### 4. Memory Integration
- **Import from Memory**: Button to import content from MEMORY.md or daily logs
- **Auto-Sync**: Option to automatically sync specific memory sections
- **Memory References**: Link documents back to specific memory entries

### 5. Document Types
- **Guidelines**: Guardrails, Brews, Orchestration patterns
- **Reports**: Security audits, vulnerability assessments, performance reports
- **Daily Logs**: AI poll results, sync summaries, email monitoring notes
- **Agent Docs**: Sub-agent behaviors, coding patterns, prompt templates
- **System Docs**: Configuration guides, API documentation, troubleshooting

## Database Schema

```sql
-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'guidelines', 'reports', 'daily_logs', 'agent_docs', 'system_docs'
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual', -- 'manual', 'memory', 'automated'
  visibility TEXT DEFAULT 'private', -- 'private', 'public'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- user_id or 'jarvis'
  memory_path TEXT, -- path to source memory file if imported
  version INTEGER DEFAULT 1
);

-- Document Versions (for history)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Document Relationships (for linking related docs)
CREATE TABLE document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related' -- 'related', 'follows', 'references'
);
```

## API Endpoints

```
GET    /api/docs                    - List all documents (with filters)
GET    /api/docs/:id                - Get single document
POST   /api/docs                    - Create new document
PUT    /api/docs/:id                - Update document
DELETE /api/docs/:id                - Delete document
GET    /api/docs/:id/versions       - Get document version history
POST   /api/docs/import-from-memory - Import from memory file
GET    /api/docs/search?q=:query    - Search documents
```

## UI Components

### `/docs` Page
- Sidebar with categories and filters
- Main content area with document grid/list
- Search bar at top
- "New Doc" button
- "Import from Memory" button

### `/docs/[id]` Page
- Breadcrumb navigation
- Document title and metadata
- Content area (rich text/Markdown)
- Action buttons: Edit, Export, Delete, Link Docs
- Version history sidebar/panel
- Related docs section

### `/docs/new` Page
- Form: Title, Category, Tags, Content
- Save/Cancel buttons
- Preview toggle

### `/docs/[id]/edit` Page
- Same as new form with pre-filled data
- Save/Cancel buttons
- Version comparison tool

## Initial Content to Import

From `/root/clawd/`:
- MEMORY.md → "System Memory"
- AGENTS.md → "Agent Configuration"
- TOOLS.md → "Tool Documentation"
- SOUL.md → "Jarvis Identity"
- USER.md → "User Profile"

From memory files:
- `memory/orchestration-system.md` → "Orchestration System"
- `memory/YYYY-MM-DD.md` files → "Daily Logs"

From skills:
- Relevant skill SKILL.md files → Agent documentation

## Implementation Priority

1. **Phase 1**: Core CRUD for documents
   - Database schema
   - API endpoints
   - Basic listing and detail pages
   - Markdown editor integration

2. **Phase 2**: Categories and tags
   - Sidebar with categories
   - Tag management
   - Filtering and search

3. **Phase 3**: Memory integration
   - Import from memory functionality
   - Auto-sync capabilities
   - Memory references

4. **Phase 4**: Advanced features
   - Version history
   - Document relationships
   - Export options
   - Related docs suggestions

## Success Criteria
- [ ] Can create, edit, delete documents
- [ ] Can import content from memory files
- [ ] Can search and filter documents
- [ ] Documents are properly categorized and tagged
- [ ] Rich text/markdown editor works smoothly
- [ ] Version history is tracked
- [ ] Mobile-responsive design
- [ ] No hydration errors
