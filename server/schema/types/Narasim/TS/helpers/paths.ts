import path from 'path'

/**
 * Normalize a user-supplied rootDir against the project base directory.
 * Always returns an absolute path inside `baseDir`. Rejects absolute or
 * outside-base paths.
 */
export function resolveRoot(baseDir: string, rootDir?: string | null): string {
  if (!rootDir) {
    return baseDir
  }

  const cleaned = rootDir.replace(/^\/+/, '')
  const absolute = path.resolve(baseDir, cleaned)
  const relative = path.relative(baseDir, absolute)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`rootDir must be inside the project: ${rootDir}`)
  }

  return absolute
}

/** Convert an absolute file path to a POSIX path relative to `baseDir`. */
export function toRelative(baseDir: string, absolutePath: string): string {
  return path.relative(baseDir, absolutePath).split(path.sep).join('/')
}

/** Resolve a user-supplied file path argument to an absolute path within base. */
export function resolveDirFile(baseDir: string, filePath: string): string {
  const cleaned = filePath.replace(/^\/+/, '')
  const absolute = path.resolve(baseDir, cleaned)
  const relative = path.relative(baseDir, absolute)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path must be inside the project: ${filePath}`)
  }

  return absolute
}
