CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_key_results_goal_id ON goal_key_results(goal_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access goals" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access goal_key_results" ON goal_key_results FOR ALL USING (true) WITH CHECK (true);
