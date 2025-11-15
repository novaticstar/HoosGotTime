import { prisma } from "@/lib/prisma"

export async function ensureUserProfile(userId: string, email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (existingUser) {
    return existingUser
  }

  return await prisma.user.create({
    data: {
      id: userId,
      email,
    },
  })
}
