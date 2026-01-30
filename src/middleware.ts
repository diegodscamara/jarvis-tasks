import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const pathname = req.nextUrl.pathname
  const isLoggedIn = !!req.auth
  const isLoginPage = pathname === '/login'
  const isApiRoute = pathname.startsWith('/api/')

  if (isApiRoute || isLoginPage) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)',
  ],
}
