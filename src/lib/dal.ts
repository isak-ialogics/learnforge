import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'

export const verifySession = cache(async (): Promise<{ isAuth: true; userId: string }> => {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/login')
  }
  return { isAuth: true, userId: session.userId }
})

/** Returns userId if authenticated, null otherwise (no redirect). */
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const session = await getSession()
  return session?.userId ?? null
})
