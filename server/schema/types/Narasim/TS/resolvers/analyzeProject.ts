/* eslint-disable no-console */
import { builder } from 'server/schema/builder'
import ts from 'typescript'

builder.queryField('analyzeProject', (t) =>
  t.field({
    type: 'Json',
    async resolve() {
      /**
       * Так мы читаем только конкретные файлы
       */
      // const program = ts.createProgram({
      //   // rootNames: [resolve(process.cwd(), 'src/index.ts')],
      //   rootNames: ['src/pages/_app.tsx'],
      //   options: {},
      // })

      /**
       * А так мы читаем все файлы в проекте
       */
      const configPath = ts.findConfigFile(
        './',
        ts.sys.fileExists,
        'tsconfig.json',
      )

      if (!configPath) {
        throw new Error('tsconfig not found')
      }

      const configFile = ts.readConfigFile(configPath, ts.sys.readFile)

      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        './',
      )

      const program = ts.createProgram({
        rootNames: parsed.fileNames,
        options: parsed.options,
      })

      // const checker = program.getTypeChecker()

      const sourceFiles = program.getSourceFiles()

      const cwd = process.cwd()

      const projectFiles = sourceFiles.filter(
        (n) => !n.fileName.includes('node_modules'),
      )

      type FileInfo = {
        relativePath: string
      }

      const files: FileInfo[] = []

      // for (const sourceFile of sourceFiles) {
      for (const sourceFile of projectFiles) {
        const relativePath = sourceFile.fileName.replace(cwd, '')

        // if (relativePath.startsWith('/node_modules/')) {
        //   continue
        // }

        console.log('relativePath', relativePath)

        files.push({
          relativePath,
        })

        if (sourceFile.isDeclarationFile) {
          continue
        }

        // ts.forEachChild(sourceFile, (node) => {
        //   if (ts.isFunctionDeclaration(node) && node.name) {
        //     const symbol = checker.getSymbolAtLocation(node.name)

        //     console.log('EXPORT:', symbol?.getName())
        //   }
        // })

        // TODO Remove
        // break
      }

      // console.log('projectFiles[0]', projectFiles[0])

      console.log('projectFiles.length', projectFiles.length)

      return {
        files,
      }
    },
  }),
)
