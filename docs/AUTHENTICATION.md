# Authentication System

## Overview

Jarvis Tasks includes an optional authentication system built with NextAuth.js (Auth.js v5). It supports:

- GitHub OAuth authentication
- Single-user mode (default - no auth required)
- Multi-user mode (auth required, tasks filtered by user)
- Session management with JWT
- Protected API routes
- User-specific task filtering

## Quick Start

### 1. Single User Mode (Default)

By default, Jarvis Tasks runs in single-user mode with no authentication:

```bash
# No configuration needed
pnpm dev
```

### 2. Multi-User Mode with GitHub Auth

To enable authentication:

1. **Create GitHub OAuth App**
   - Go to https://github.com/settings/applications/new
   - Application name: `Jarvis Tasks`
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Save and copy Client ID and Client Secret

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   # Enable authentication
   NEXT_PUBLIC_AUTH_ENABLED=true
   NEXT_PUBLIC_MULTI_USER_MODE=true

   # NextAuth configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

   # GitHub OAuth
   GITHUB_CLIENT_ID=<your-github-client-id>
   GITHUB_CLIENT_SECRET=<your-github-client-secret>
   ```

3. **Start the application**
   ```bash
   pnpm dev
   ```

## Features

### Protected Routes

When authentication is enabled, all routes except `/login` are protected:

- API routes require valid session
- UI redirects to login page
- User context available in all components

### Task Ownership

In multi-user mode:
- Tasks are associated with the creating user
- Each user only sees their own tasks
- Shared tasks (no owner) visible to all
- Assignee field works independently of ownership

### Session Management

- Sessions expire after 30 days
- JWT-based for stateless operation
- User info stored in session (id, name, email, image)
- Automatic token refresh

### User Menu

When authenticated, users see:
- Profile avatar from GitHub
- Sign out option
- User name and email

## API Integration

### Protected API Routes

Use the `protectRoute` helper:

```typescript
import { protectRoute } from '@/lib/auth'

export const GET = protectRoute(async (req, session) => {
  // session.user is guaranteed to exist
  return NextResponse.json({
    userId: session.user.id,
    tasks: await getTasksForUser(session.user.id)
  })
})
```

### Getting Current User

```typescript
import { getCurrentUser } from '@/lib/auth'

const user = await getCurrentUser()
if (user) {
  console.log('Logged in as:', user.name)
}
```

### Filtering by User

```typescript
import { filterByUser } from '@/lib/auth'

const allTasks = await db.getAllTasks()
const userTasks = filterByUser(allTasks, userId)
```

## Production Deployment

For production (especially Vercel):

1. **Set production URLs**
   ```env
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

2. **Update GitHub OAuth callback**
   - Edit your GitHub OAuth app
   - Change callback URL to: `https://your-app.vercel.app/api/auth/callback/github`

3. **Generate secure secret**
   ```bash
   openssl rand -base64 32
   ```

4. **Add to Vercel environment variables**
   - All env vars from `.env.local`
   - Ensure `NEXTAUTH_SECRET` is set

## Testing

Run authentication tests:

```bash
pnpm test src/__tests__/auth
pnpm test src/__tests__/lib/auth.test.ts
```

## Troubleshooting

### "Unauthorized" errors
- Check `NEXT_PUBLIC_AUTH_ENABLED` is set correctly
- Verify session exists with browser DevTools
- Check middleware is running

### GitHub OAuth errors
- Verify callback URL matches exactly
- Check Client ID and Secret are correct
- Ensure GitHub app is not in development mode

### Session not persisting
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Clear cookies and try again

## Security Considerations

1. **Always use HTTPS in production**
2. **Keep `NEXTAUTH_SECRET` secure and unique**
3. **Rotate secrets periodically**
4. **Use environment variables, never commit secrets**
5. **Enable GitHub 2FA for admin accounts**

## Future Enhancements

- [ ] Support for more OAuth providers (Google, GitLab)
- [ ] Email/password authentication option
- [ ] Role-based access control (admin/user)
- [ ] API key authentication for automation
- [ ] Team/organization support