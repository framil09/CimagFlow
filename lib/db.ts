import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Só instancia o Prisma se DATABASE_URL estiver definida (evita erro durante build)
export const prisma = globalForPrisma.prisma ?? (
  process.env.DATABASE_URL 
    ? new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      })
    : null as any as PrismaClient
)

// Sempre guarda o singleton para evitar múltiplas conexões (apenas se não for null)
if (process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma
}

export default prisma;
