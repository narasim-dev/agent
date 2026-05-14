import fs from 'fs'

export async function createDirectoriesRecursive(
  dirPath: string,
): Promise<true> {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  return true
}
