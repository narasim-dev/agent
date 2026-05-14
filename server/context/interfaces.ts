import { ExpressContextFunctionArgument } from '@as-integrations/express5'
import type { PrismaClient, Token, User } from '@prisma/client'
import type { World3dClient } from '../world3d/client'
import type { LLMClient } from '../llm/client'
import { dockerClient } from 'server/docker'

export interface PrismaContext {
  prisma: PrismaClient
  req:
    | ExpressContextFunctionArgument['req']
    | { headers: { authorization: string | undefined } }
    | undefined

  // Authorized user
  currentUser: User | null

  /**
   * Current user Auth token
   */
  Token: (Token & { User: User | null }) | null

  /**
   * Raw JWT token from Authorization header (for external API calls)
   */
  token: string | null

  /**
   * World3D API client for docker/world3d service
   */
  world3dClient: World3dClient

  /**
   * LLM LLM API client
   */
  llmClient: LLMClient

  dockerClient: typeof dockerClient
}
