-- Task Templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT NOT NULL DEFAULT 'jarvis',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  estimate INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_name ON task_templates(name);

-- RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public access" ON task_templates FOR ALL USING (true) WITH CHECK (true);
