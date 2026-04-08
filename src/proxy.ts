import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/practice']
const publicRoutes = ['/login', '/signup', '/']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(r + '/')
  )
  const isPublic = publicRoutes.some(
    (r) => path === r || path.startsWith(r + '/')
  )

  const token = req.cookies.get('lf_session')?.value
  const session = await decrypt(token)

  if (isProtected && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }

  if (isPublic && session?.userId && path !== '/') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)'],
}
