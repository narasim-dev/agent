import { builder } from 'server/schema/builder'
import ts from 'typescript'
import { getProgram } from '../helpers/getProgram'
import { resolveDirFile, toRelative } from '../helpers/paths'
import { listTopLevelDeclarations } from '../helpers/listTopLevelDeclarations'
import { detectKind } from '../helpers/detectKind'

interface ParameterInfo {
  name: string
  type: string
  optional: boolean
  hasDefault: boolean
}

interface EntityInfo {
  path: string
  name: string
  kind: string
  line: number
  exported: boolean
  jsdoc?: string
  signature?: string
  returnType?: string
  parameters?: ParameterInfo[]
}

function getJsDoc(node: ts.Node): string | undefined {
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

function getFunctionLikeNode(
  node: ts.Node,
): ts.SignatureDeclaration | undefined {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node)
  ) {
    return node
  }

  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    return node.initializer
  }

  return undefined
}

function describeParameter(
  checker: ts.TypeChecker,
  param: ts.ParameterDeclaration,
): ParameterInfo {
  const type = checker.getTypeAtLocation(param)
  const name = ts.isIdentifier(param.name)
    ? param.name.text
    : param.name.getText()

  return {
    name,
    type: checker.typeToString(type),
    optional: Boolean(param.questionToken) || Boolean(param.initializer),
    hasDefault: Boolean(param.initializer),
  }
}

builder.queryField('analyzeEntity', (t) =>
  t.field({
    type: 'Json',
    args: {
      projectRoot: t.arg.string({ required: true }),
      path: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
    },
    resolve(_root, args): EntityInfo {
      const { program, checker, baseDir } = getProgram({
        projectRoot: args.projectRoot,
      })
      const absolute = resolveDirFile(baseDir, args.path)
      const sourceFile = program.getSourceFile(absolute)

      if (!sourceFile) {
        throw new Error(`File not found in program: ${args.path}`)
      }

      const decls = listTopLevelDeclarations(sourceFile)
      const decl = decls.find((d) => d.name === args.name)

      if (!decl) {
        throw new Error(
          `Entity "${args.name}" not found at top level of ${args.path}`,
        )
      }

      const kind = detectKind(decl.node, decl.name)
      const line =
        sourceFile.getLineAndCharacterOfPosition(decl.node.getStart(sourceFile))
          .line + 1

      const base: EntityInfo = {
        path: toRelative(baseDir, sourceFile.fileName),
        name: decl.name,
        kind,
        line,
        exported: decl.exported,
        jsdoc: getJsDoc(decl.node),
      }

      const fn = getFunctionLikeNode(decl.node)
      if (fn) {
        const signature = checker.getSignatureFromDeclaration(fn)
        if (signature) {
          base.signature = checker.signatureToString(signature)
          base.returnType = checker.typeToString(
            checker.getReturnTypeOfSignature(signature),
          )
        }
        base.parameters = fn.parameters.map((p) =>
          describeParameter(checker, p),
        )
      }

      return base
    },
  }),
)
