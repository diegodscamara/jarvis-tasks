import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'

export interface User {
  id: string
  email: string
  name: string
  image?: string
}

export interface Session {
  user: User
  expires: string
}

/**
 * Protect an API route handler
 * Returns 401 if no valid session exists
 */
export async function protectRoute<T>(
  handler: (req: NextRequest, session: Session) => Promise<T>
) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(req, session as Session)
  }
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  return session?.user as User | null
}

/**
 * Check if auth is required based on config
 */
export function isAuthRequired(): boolean {
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'
  const multiUserMode = process.env.NEXT_PUBLIC_MULTI_USER_MODE === 'true'
  
  return authEnabled && multiUserMode
}

/**
 * Filter tasks by user in multi-user mode
 */
export function filterByUser<T extends { createdBy?: string | null }>(
  items: T[],
  userId: string | null,
  includeShared = true
): T[] {
  if (!isAuthRequired() || !userId) {
    return items
  }
  
  return items.filter(item => 
    item.createdBy === userId || (includeShared && !item.createdBy)
  )
}

/**
 * Add user context to a new item
 */
export function addUserContext<T>(
  item: T,
  userId: string | null
): T & { createdBy?: string } {
  if (!isAuthRequired() || !userId) {
    return item
  }
  
  return {
    ...item,
    createdBy: userId,
  }
}