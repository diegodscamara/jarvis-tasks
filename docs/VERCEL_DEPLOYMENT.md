# Vercel Deployment Fix

## Problem
Comments and other data disappear when using Jarvis Tasks on Vercel because:
- SQLite requires filesystem write access
- Vercel's serverless functions have read-only filesystems
- Each function invocation is isolated

## Solution
We need to migrate from SQLite to a cloud database. Options:

### Option 1: Supabase (Recommended)
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Run `supabase-schema.sql` in the SQL editor
4. Add environment variables to Vercel:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

### Option 2: Upstash Redis
- Use Redis for temporary storage with JSON serialization
- Good for small datasets
- Already have Upstash CLI configured

### Option 3: PlanetScale
- MySQL-compatible serverless database
- Good for relational data
- Free tier available

## Quick Fix (Temporary)
For now, users should:
1. Use the app only locally (`pnpm dev`)
2. Or accept that data won't persist on Vercel
3. Wait for the cloud database implementation

## Implementation Status
- [x] Tests written demonstrating the issue
- [x] Database adapter pattern created
- [x] SQLite adapter implemented
- [x] Supabase schema created
- [ ] Supabase adapter implementation
- [ ] Environment variables setup
- [ ] Migration script for existing data