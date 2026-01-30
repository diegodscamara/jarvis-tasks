-- Supabase Schema for Jarvis Tasks
-- Run this in Supabase SQL Editor to set up the database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  lead TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "group" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'planning', 'todo', 'in_progress', 'review', 'done')),
  assignee TEXT NOT NULL DEFAULT 'jarvis',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimate NUMERIC,
  parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task labels junction table
CREATE TABLE IF NOT EXISTS task_labels (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Task links table
CREATE TABLE IF NOT EXISTS task_links (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  type TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);
CREATE INDEX idx_task_links_task_id ON task_links(task_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (adjust for your auth needs)
CREATE POLICY "Allow anonymous read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON labels FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON labels FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON labels FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON tasks FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON comments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON comments FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON task_labels FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON task_labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON task_labels FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON task_labels FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read" ON task_links FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON task_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON task_links FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON task_links FOR DELETE USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();