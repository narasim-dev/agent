import type { User } from '@prisma/client'
import { prismaClient } from '../prisma'
import { TokenType, verifyToken } from '../schema/types/User/helpers/auth'
import { world3dClient } from '../world3d/client'
import { llmClient } from '../llm/client'
import { PrismaContext } from './interfaces'
import { dockerClient } from 'server/docker'

type CreateContextArgs = {
  req: PrismaContext['req'] | { headers: { authorization: string | undefined } }
}

export async function createContext({
  req,
}: CreateContextArgs): Promise<PrismaContext> {
  let currentUser: User | null = null
  let token: string | null = null

  const authHeader = req?.headers.authorization

  if (authHeader) {
    token = authHeader.replace('Bearer ', '')
    const payload = await verifyToken({
      token,
      type: TokenType.Auth,
      prisma: prismaClient,
    })

    if (payload?.userId) {
      currentUser = await prismaClient.user.findUnique({
        where: { id: payload.userId },
      })
    }
  }

  return {
    prisma: prismaClient,
    currentUser,
    Token: null,
    token,
    req,
    world3dClient,
    llmClient,
    dockerClient,
  }
}
