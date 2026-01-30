# Create task_links table in Supabase

This script will create the task_links table in Supabase. You can run it via:
1. The Supabase dashboard (SQL Editor)
2. Or using psql with the connection string

## SQL to run:

```sql
CREATE TABLE IF NOT EXISTS task_links (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'link',
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT task_links_task_id_fkey
    FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);

ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view links for their tasks"
  ON task_links FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create links"
  ON task_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update links"
  ON task_links FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete links"
  ON task_links FOR DELETE
  USING (true);
```

## To generate updated types after creating the table:

```bash
supabase gen types typescript --linked > src/lib/supabase/types.ts
```
