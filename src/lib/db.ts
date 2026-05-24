import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're on Vercel (serverless, read-only filesystem)
const isVercel = !!process.env.VERCEL

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

let _db: PrismaClient | null = null

function getDb(): PrismaClient {
  if (!_db) {
    try {
      _db = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
    } catch (err) {
      console.error('Failed to create PrismaClient:', err)
      throw err
    }
  }
  return _db
}

// Safe database access - returns null if database is unavailable
export async function safeDb<T>(
  operation: (db: PrismaClient) => Promise<T>
): Promise<T | null> {
  try {
    const client = getDb()
    return await operation(client)
  } catch (err) {
    console.error('Database operation failed (non-critical on Vercel):', err)
    return null
  }
}

// Legacy export for backward compatibility
export const db = (() => {
  try {
    return globalForPrisma.prisma ?? createPrismaClient()
  } catch {
    // Return a proxy that silently fails on Vercel
    if (isVercel) {
      return new Proxy({} as PrismaClient, {
        get() {
          return () => Promise.resolve(null)
        }
      })
    }
    throw new Error('Database unavailable')
  }
})()

if (process.env.NODE_ENV !== 'production' && !isVercel) globalForPrisma.prisma = db
