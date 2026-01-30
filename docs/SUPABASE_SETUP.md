# Supabase Setup Guide

This guide will help you set up Supabase for the Jarvis Tasks application.

## Prerequisites

- A Supabase account (free tier is fine)
- Node.js and pnpm installed
- The Jarvis Tasks repository cloned

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - Project name: `jarvis-tasks`
   - Database password: Choose a strong password
   - Region: Select the closest region to your users
   - Pricing plan: Free tier is sufficient for development

## Step 2: Run Database Migrations

1. Once your project is created, go to the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor and click "Run"

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to your project settings
   - Navigate to "API" section
   - Copy the `URL` and `anon public` key

3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 4: Migrate Existing Data (Optional)

If you have existing data in SQLite:

1. Make sure your Supabase project is set up
2. Ensure your `.env.local` has the correct credentials
3. Run the migration script:
   ```bash
   pnpm run migrate:supabase
   ```

## Step 5: Enable Realtime (Optional but Recommended)

Realtime is already enabled for the main tables in the migration. To verify:

1. Go to your Supabase dashboard
2. Navigate to "Database" → "Replication"
3. Ensure these tables have realtime enabled:
   - `tasks`
   - `comments`
   - `notifications`
   - `task_dependencies`

## Step 6: Configure Row Level Security (RLS)

The migration script sets up basic RLS policies that allow public access. For production, you should:

1. Enable authentication in your app
2. Update RLS policies to check user authentication
3. Example policy for authenticated users:
   ```sql
   CREATE POLICY "Users can view own tasks" ON tasks
   FOR SELECT USING (auth.uid() = user_id);
   ```

## Step 7: Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Features Available with Supabase

- **Persistent Storage**: All data is stored in PostgreSQL
- **Real-time Updates**: Live updates when tasks change
- **Authentication Ready**: Easy to add user authentication
- **File Storage**: Can add file attachments using Supabase Storage
- **Edge Functions**: Can add serverless functions for complex logic
- **Database Backups**: Automatic daily backups (on paid plans)

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that your IP is not blocked in Supabase settings
- Ensure the database is not paused (free tier pauses after 1 week of inactivity)

### Migration Errors
- Make sure to run migrations in order
- Check for existing data that might conflict
- Look at the Supabase logs for detailed error messages

### Performance Issues
- Ensure indexes are created (they are in the migration)
- Use the Supabase query performance analyzer
- Consider upgrading to a paid plan for better performance

## Next Steps

- Set up authentication with Supabase Auth
- Configure email notifications
- Add file attachments using Supabase Storage
- Set up database backups and monitoring