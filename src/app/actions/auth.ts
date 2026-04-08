'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export type AuthState =
  | { errors?: { email?: string[]; password?: string[]; name?: string[] }; message?: string }
  | undefined

export async function signup(state: AuthState, formData: FormData): Promise<AuthState> {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  const errors: NonNullable<NonNullable<AuthState>['errors']> = {}

  if (name.length < 2) errors.name = ['Name must be at least 2 characters.']
  if (!email.includes('@')) errors.email = ['Please enter a valid email address.']
  if (password.length < 8) errors.password = ['Password must be at least 8 characters.']

  if (Object.keys(errors).length > 0) return { errors }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return { errors: { email: ['An account with this email already exists.'] } }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { name, email, hashedPassword } })

  await createSession(user.id)
  redirect('/dashboard')
}

export async function login(state: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { message: 'Email and password are required.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { message: 'Invalid email or password.' }

  const valid = await bcrypt.compare(password, user.hashedPassword)
  if (!valid) return { message: 'Invalid email or password.' }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
