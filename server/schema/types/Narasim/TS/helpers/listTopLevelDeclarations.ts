import ts from 'typescript'

export interface TopLevelDeclaration {
  name: string
  /** The actual declaration node we want to inspect (function, class, var decl, …). */
  node: ts.Node
  /** Whether the declaration is exported from the module. */
  exported: boolean
}

function isExported(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? (ts.getModifiers(node) ?? [])
    : []
  return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

/**
 * Iterate top-level declarations of a SourceFile and yield a flat list of
 * named bindings together with the original node and its export flag.
 */
export function listTopLevelDeclarations(
  sourceFile: ts.SourceFile,
): TopLevelDeclaration[] {
  const out: TopLevelDeclaration[] = []

  for (const stmt of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(stmt) ||
      ts.isClassDeclaration(stmt) ||
      ts.isInterfaceDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      if (stmt.name) {
        out.push({
          name: stmt.name.text,
          node: stmt,
          exported: isExported(stmt),
        })
      }
      continue
    }

    if (ts.isVariableStatement(stmt)) {
      const exported = isExported(stmt)
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          out.push({
            name: decl.name.text,
            node: decl,
            exported,
          })
        }
      }
    }
  }

  return out
}
