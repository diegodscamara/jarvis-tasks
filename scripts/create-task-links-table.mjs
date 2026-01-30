import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTaskLinksTable() {
  console.log('Creating task_links table via REST API...')

  // Use the SQL endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      sql: `
        CREATE TABLE IF NOT EXISTS task_links (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          title TEXT,
          type TEXT NOT NULL DEFAULT 'link',
          icon TEXT,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
      `,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Error creating table:', response.status, text)
    process.exit(1)
  }

  console.log('✓ task_links table created successfully')
}

createTaskLinksTable().catch(console.error)
