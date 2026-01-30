import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTaskLinksTable() {
  const sql = `
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
    DROP POLICY IF EXISTS "Users can view links for their tasks" ON task_links;
    CREATE POLICY "Users can view links for their tasks"
      ON task_links FOR SELECT
      USING (true);

    DROP POLICY IF EXISTS "Users can create links" ON task_links;
    CREATE POLICY "Users can create links"
      ON task_links FOR INSERT
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can update links" ON task_links;
    CREATE POLICY "Users can update links"
      ON task_links FOR UPDATE
      USING (true);

    DROP POLICY IF EXISTS "Users can delete links" ON task_links;
    CREATE POLICY "Users can delete links"
      ON task_links FOR DELETE
      USING (true);
  `

  console.log('Creating task_links table...')

  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('Error creating table:', error)
    process.exit(1)
  }

  console.log('✓ task_links table created successfully')
}

createTaskLinksTable()
