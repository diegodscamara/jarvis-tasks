-- Documents table (enhanced from existing simple version)
DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'jarvis',
  memory_path TEXT,
  version INTEGER NOT NULL DEFAULT 1
);

-- Document Versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'jarvis'
);

-- Document Relations table
CREATE TABLE document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Logs table (replaces agent_logs with more comprehensive schema)
DROP TABLE IF EXISTS agent_logs CASCADE;

CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('agent_action', 'dispatch', 'task_event', 'system_event', 'message', 'error', 'success')),
  actor TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context JSONB DEFAULT '{}',
  session_id TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  related_type TEXT,
  related_id UUID,
  tags TEXT[] DEFAULT '{}'
);

-- Log Sessions table
CREATE TABLE log_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  parent_session_id UUID REFERENCES log_sessions(id)
);

-- Indexes for performance
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_relations_source ON document_relations(source_id);
CREATE INDEX idx_document_relations_target ON document_relations(target_id);
CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_actor ON logs(actor);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_status ON logs(status);
CREATE INDEX idx_logs_session_id ON logs(session_id);
CREATE INDEX idx_logs_context ON logs USING gin(context);
CREATE INDEX idx_log_sessions_status ON log_sessions(status);
CREATE INDEX idx_log_sessions_started_at ON log_sessions(started_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public access" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON document_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON document_relations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON log_sessions FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for logs
ALTER PUBLICATION supabase_realtime ADD TABLE logs;
ALTER PUBLICATION supabase_realtime ADD TABLE log_sessions;
