import { builder } from 'server/schema/builder'
import { getProgram } from '../helpers/getProgram'
import { resolveRoot, toRelative } from '../helpers/paths'

builder.queryField('analyzeDir', (t) =>
  t.field({
    type: 'Json',
    args: {
      projectRoot: t.arg.string({ required: true }),
      rootDir: t.arg.string({ required: false }),
    },
    resolve(_root, args) {
      const { program, baseDir } = getProgram({ projectRoot: args.projectRoot })
      const root = resolveRoot(baseDir, args.rootDir ?? null)

      const files = program
        .getSourceFiles()
        .filter((sf) => !sf.fileName.includes('node_modules'))
        .filter((sf) => !sf.isDeclarationFile)
        .filter(
          (sf) => sf.fileName === root || sf.fileName.startsWith(root + '/'),
        )
        .map((sf) => ({ path: toRelative(baseDir, sf.fileName) }))
        .sort((a, b) => a.path.localeCompare(b.path))

      return {
        rootDir: toRelative(baseDir, root) || '.',
        count: files.length,
        files,
      }
    },
  }),
)
