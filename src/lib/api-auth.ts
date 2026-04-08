import { getSession } from './session'

/** Returns userId for the current request, or throws a 401 Response. */
export async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.userId) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session.userId
}
