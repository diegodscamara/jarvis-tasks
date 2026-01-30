-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁' NOT NULL,
  color TEXT DEFAULT '#6366f1' NOT NULL,
  description TEXT,
  lead TEXT DEFAULT 'jarvis' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "group" TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' NOT NULL CHECK (status IN ('backlog', 'planning', 'todo', 'in_progress', 'review', 'done')),
  assignee TEXT DEFAULT 'jarvis' NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimate INTEGER,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create task_labels junction table
CREATE TABLE task_labels (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create task_dependencies table
CREATE TABLE task_dependencies (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (task_id, depends_on_id),
  -- Ensure a task cannot depend on itself
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create users table for profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_id ON task_dependencies(depends_on_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Public read access for now (can be refined based on auth requirements)
CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON labels FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON labels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON labels FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON task_labels FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON task_labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON task_labels FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON task_dependencies FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON task_dependencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON task_dependencies FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON comments FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON attachments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON attachments FOR DELETE USING (true);

-- Notifications are user-specific
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT 
  USING (user_id = COALESCE(auth.jwt() ->> 'sub', 'anonymous'));
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT 
  WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', 'anonymous'));
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE 
  USING (user_id = COALESCE(auth.jwt() ->> 'sub', 'anonymous'));
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE 
  USING (user_id = COALESCE(auth.jwt() ->> 'sub', 'anonymous'));

-- Users profiles
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE task_dependencies;