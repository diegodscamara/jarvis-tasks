# Smart Search & Filters Spec

## Overview
Enhance the task management system with advanced search capabilities, complex filtering, and saved searches.

## Features

### 1. Full-Text Search
- Search across title, description, and comments
- Highlight matching terms
- Fuzzy matching for typos
- Search result scoring/ranking

### 2. Advanced Filters
- Multiple filter combinations
- Filter by:
  - Status (multiple)
  - Priority (multiple)
  - Assignee (multiple)
  - Project
  - Labels (multiple)
  - Date ranges (created, updated, due)
  - Has attachments
  - Has comments
  - Time estimates
  - Completion percentage

### 3. Search Syntax
- Support query operators:
  - `title:"exact match"`
  - `priority:high`
  - `assignee:jarvis`
  - `due:tomorrow`
  - `due:2024-01-15..2024-01-20`
  - `has:comments`
  - `is:overdue`
  - `project:jarvis`
  - `label:bug`

### 4. Saved Searches
- Save frequently used searches
- Name and organize saved searches
- Quick access from sidebar
- Share saved searches

### 5. Search History
- Recent searches dropdown
- Clear history option
- Most used searches

### 6. UI Features
- Real-time search results
- Search suggestions/autocomplete
- Filter pills with counts
- Clear all filters
- Export search results

## Implementation Plan
1. Enhance search API endpoint
2. Build query parser
3. Implement full-text search
4. Create filter builder UI
5. Add saved searches
6. Implement search history