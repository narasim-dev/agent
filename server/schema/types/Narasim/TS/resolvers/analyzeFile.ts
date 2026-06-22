/* eslint-disable no-console */
import { builder } from 'server/schema/builder'
import ts from 'typescript'
import { getProgram } from '../helpers/getProgram'
import { resolveDirFile, toRelative } from '../helpers/paths'
import {
  listTopLevelDeclarations,
  TopLevelDeclaration,
} from '../helpers/listTopLevelDeclarations'
import { detectKind } from '../helpers/detectKind'

interface ExportInfo {
  name: string
  kind: string
  line: number
  jsdoc?: string
}

const ImportedBinding = builder.simpleObject('ImportedBinding', {
  fields: (t) => ({
    name: t.string({ nullable: false }),
    alias: t.string(),
  }),
})

type ImportedBinding = typeof ImportedBinding.$inferType

// interface ImportedBinding {
//   name: string
//   alias?: string
// }

// interface ImportInfo {
//   module: string
//   /** Resolved file path relative to baseDir, when TypeScript can resolve it. */
//   resolvedPath?: string
//   default?: string
//   namespace?: string
//   named: ImportedBinding[]
//   isExternalLibraryImport: boolean | undefined
// }

const ImportInfo = builder.simpleObject('ImportInfo', {
  fields: (t) => ({
    module: t.string({ nullable: false }),
    resolvedPath: t.string(),
    default: t.string(),
    namespace: t.string(),
    named: t.field({ type: [ImportedBinding] }),
    isExternalLibraryImport: t.boolean(),
  }),
})

type ImportInfo = typeof ImportInfo.$inferType

function getJsDoc(node: ts.Node): string | undefined {
  // Look at the declaration itself first, then walk up to the export/var
  // statement which is where JSDoc usually attaches.
  const candidates: ts.Node[] = [node]
  if (node.parent) {
    candidates.push(node.parent)
  }
  if (node.parent?.parent) {
    candidates.push(node.parent.parent)
  }

  for (const candidate of candidates) {
    const docs = ts.getJSDocCommentsAndTags(candidate)
    const text = docs
      .map((d) =>
        typeof d.comment === 'string'
          ? d.comment
          : (d.comment ?? []).map((c) => c.text).join(''),
      )
      .filter(Boolean)
      .join('\n')
      .trim()
    if (text) {
      return text
    }
  }
  return undefined
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  )
}

function buildExports(
  sourceFile: ts.SourceFile,
  decls: TopLevelDeclaration[],
): ExportInfo[] {
  return decls
    .filter((d) => d.exported)
    .map((d) => ({
      name: d.name,
      kind: detectKind(d.node, d.name),
      line: lineOf(sourceFile, d.node),
      jsdoc: getJsDoc(d.node),
    }))
}

function buildImports(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  baseDir: string,
): ImportInfo[] {
  const out: ImportInfo[] = []

  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) {
      continue
    }
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) {
      continue
    }

    const moduleSpec = stmt.moduleSpecifier.text
    const named: ImportedBinding[] = []
    let defaultName: string | undefined
    let namespaceName: string | undefined

    const clause = stmt.importClause
    if (clause) {
      if (clause.name) {
        defaultName = clause.name.text
      }
      if (clause.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) {
          namespaceName = clause.namedBindings.name.text
        } else {
          for (const el of clause.namedBindings.elements) {
            named.push({
              name: el.propertyName?.text ?? el.name.text,
              alias: el.propertyName ? el.name.text : undefined,
            })
          }
        }
      }
    }

    const resolved = ts.resolveModuleName(
      moduleSpec,
      sourceFile.fileName,
      program.getCompilerOptions(),
      ts.sys,
    ).resolvedModule

    console.log('resolved', resolved)

    out.push({
      module: moduleSpec,
      resolvedPath:
        resolved && !resolved.isExternalLibraryImport
          ? toRelative(baseDir, resolved.resolvedFileName)
          : undefined,
      default: defaultName,
      namespace: namespaceName,
      named,
      isExternalLibraryImport: resolved?.isExternalLibraryImport,
    })
  }

  return out
}

const TsModule = builder.simpleObject('TsModule', {
  fields: (t) => ({
    path: t.string({ nullable: false }),
    exports: t.field({ type: 'Json' }),
    imports: t.field({
      type: [ImportInfo],
    }),
  }),
})

builder.queryField('analyzeFile', (t) =>
  t.field({
    // type: 'Json',
    type: TsModule,
    args: {
      projectRoot: t.arg.string({ required: true }),
      path: t.arg.string({ required: true }),
    },
    resolve(_root, args) {
      const { program, baseDir } = getProgram({ projectRoot: args.projectRoot })
      const absolute = resolveDirFile(baseDir, args.path)
      const sourceFile = program.getSourceFile(absolute)

      if (!sourceFile) {
        throw new Error(`File not found in program: ${args.path}`)
      }

      const decls = listTopLevelDeclarations(sourceFile)

      return {
        path: toRelative(baseDir, sourceFile.fileName),
        exports: buildExports(sourceFile, decls),
        imports: buildImports(program, sourceFile, baseDir),
      }
    },
  }),
)
