import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'

export default async function Nav() {
  const session = await getSession()
  if (!session?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-gray-900">
          LearnForge
        </Link>
        <Link href="/practice" className="text-sm text-gray-600 hover:text-gray-900">
          Practice
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
