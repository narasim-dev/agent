import { readFileSync } from 'fs'
import { join } from 'path'
import { SkillManifest } from '../../../../Skills/interfaces'

const description = readFileSync(join(__dirname, 'description.md'), 'utf-8')

export const skillManifest: SkillManifest = {
  name: 'TypeScript Dir Analyzer',
  description:
    'Inspect any TypeScript project codebase: list files in a folder, get file-level exports/imports, and look up an entity (function, hook, component, class, type) with its signature. Supports multiple projects simultaneously with incremental caching.',
  files: ['description.md'],
  buildContent: () => description,
}
