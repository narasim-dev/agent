import path from 'path'
import ts from 'typescript'

export interface ProgramContext {
  program: ts.Program
  checker: ts.TypeChecker
  /** Dir base directory (the folder that contains tsconfig.json). */
  baseDir: string
}

export interface GetProgramOptions {
  /** Absolute path to project root directory */
  projectRoot: string
  /** Path to tsconfig.json (relative to projectRoot or absolute). Default: 'tsconfig.json' */
  tsconfigPath?: string
}

interface CachedProject {
  program: ts.Program
  /** File versions for incremental rebuild detection */
  fileVersions: Map<string, number>
  /** Timestamp of last access */
  lastAccess: number
  /** Timer for TTL expiration */
  expirationTimer: ReturnType<typeof setTimeout>
}

/** TTL in milliseconds (30 minutes) */
const CACHE_TTL_MS = 30 * 60 * 1000

/** Cache of programs per project root */
const projectCache = new Map<string, CachedProject>()

/**
 * Get file modification time as version number.
 */
function getFileVersion(filePath: string): number {
  try {
    const stat = ts.sys.getModifiedTime?.(filePath)
    return stat ? stat.getTime() : 0
  } catch {
    return 0
  }
}

/**
 * Check if any source files have changed since last build.
 */
function hasChanges(cached: CachedProject): boolean {
  for (const [filePath, version] of cached.fileVersions) {
    if (getFileVersion(filePath) !== version) {
      return true
    }
  }
  return false
}

/**
 * Build or retrieve a cached TypeScript Program for the given project.
 * Uses incremental compilation — only rebuilds when source files change.
 */
export function getProgram(options: GetProgramOptions): ProgramContext {
  const { projectRoot, tsconfigPath = 'tsconfig.json' } = options

  const baseDir = path.resolve(projectRoot)
  const configPath = path.isAbsolute(tsconfigPath)
    ? tsconfigPath
    : path.join(baseDir, tsconfigPath)

  if (!ts.sys.fileExists(configPath)) {
    throw new Error(`tsconfig.json not found at ${configPath}`)
  }

  const cacheKey = configPath

  const cached = projectCache.get(cacheKey)
  if (cached && !hasChanges(cached)) {
    resetExpirationTimer(cacheKey, cached)
    return {
      program: cached.program,
      checker: cached.program.getTypeChecker(),
      baseDir,
    }
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    baseDir,
  )

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
    oldProgram: cached?.program,
  })

  const fileVersions = new Map<string, number>()
  for (const sourceFile of program.getSourceFiles()) {
    fileVersions.set(sourceFile.fileName, getFileVersion(sourceFile.fileName))
  }

  if (cached) {
    clearTimeout(cached.expirationTimer)
  }

  const newCached: CachedProject = {
    program,
    fileVersions,
    lastAccess: Date.now(),
    expirationTimer: createExpirationTimer(cacheKey),
  }
  projectCache.set(cacheKey, newCached)

  return {
    program,
    checker: program.getTypeChecker(),
    baseDir,
  }
}

/**
 * Reset expiration timer on cache access.
 */
function resetExpirationTimer(cacheKey: string, cached: CachedProject): void {
  clearTimeout(cached.expirationTimer)
  cached.lastAccess = Date.now()
  cached.expirationTimer = createExpirationTimer(cacheKey)
}

/**
 * Create a timer that removes the cache entry after TTL.
 */
function createExpirationTimer(
  cacheKey: string,
): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    projectCache.delete(cacheKey)
  }, CACHE_TTL_MS)
}

/**
 * Clear cached program for a specific project.
 */
export function clearProgramCache(configPath: string): void {
  const key = path.resolve(configPath)
  const cached = projectCache.get(key)
  if (cached) {
    clearTimeout(cached.expirationTimer)
    projectCache.delete(key)
  }
}

/**
 * Clear all cached programs.
 */
export function clearAllProgramCaches(): void {
  for (const cached of projectCache.values()) {
    clearTimeout(cached.expirationTimer)
  }
  projectCache.clear()
}
