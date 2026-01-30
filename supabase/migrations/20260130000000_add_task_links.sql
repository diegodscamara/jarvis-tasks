-- Create task_links table
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

-- Create index on task_id for faster queries
CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);

-- Enable RLS
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view links for their tasks"
  ON task_links FOR SELECT
  USING (true); -- For now, allow all reads

CREATE POLICY "Users can create links"
  ON task_links FOR INSERT
  WITH CHECK (true); -- For now, allow all inserts

CREATE POLICY "Users can update links"
  ON task_links FOR UPDATE
  USING (true); -- For now, allow all updates

CREATE POLICY "Users can delete links"
  ON task_links FOR DELETE
  USING (true); -- For now, allow all deletes
