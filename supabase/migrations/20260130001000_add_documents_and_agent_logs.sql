-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  path TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  category TEXT
);

-- Create agent_logs table
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  type TEXT NOT NULL CHECK (type IN ('thought', 'action', 'orchestration', 'system')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_last_updated ON documents(last_updated);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_type ON agent_logs(type);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Allow public read access" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON documents FOR DELETE USING (true);

-- Policies for agent_logs
CREATE POLICY "Allow public read access" ON agent_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON agent_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON agent_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON agent_logs FOR DELETE USING (true);

-- Enable realtime for agent_logs
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
