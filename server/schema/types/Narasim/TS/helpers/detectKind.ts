import ts from 'typescript'

export type EntityKind =
  | 'FunctionalComponent'
  | 'Hook'
  | 'Function'
  | 'Class'
  | 'Variable'
  | 'Type'
  | 'Interface'
  | 'Enum'
  | 'Unknown'

function containsJsx(node: ts.Node): boolean {
  let found = false
  const visit = (n: ts.Node): void => {
    if (found) {
      return
    }
    if (
      ts.isJsxElement(n) ||
      ts.isJsxSelfClosingElement(n) ||
      ts.isJsxFragment(n)
    ) {
      found = true
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/**
 * Infer the entity kind from the declaration node and its name.
 * Heuristics:
 *  - PascalCase + returns JSX → FunctionalComponent
 *  - useXxx → Hook
 *  - other functions → Function
 *  - class / interface / type / enum → corresponding kind
 *  - variable bindings without an inner function → Variable
 */
export function detectKind(node: ts.Node, name: string): EntityKind {
  if (ts.isClassDeclaration(node)) {
    return 'Class'
  }
  if (ts.isInterfaceDeclaration(node)) {
    return 'Interface'
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return 'Type'
  }
  if (ts.isEnumDeclaration(node)) {
    return 'Enum'
  }

  let fn: ts.FunctionLikeDeclaration | undefined

  if (ts.isFunctionDeclaration(node)) {
    fn = node
  } else if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    fn = node.initializer as ts.FunctionLikeDeclaration
  }

  if (!fn) {
    return ts.isVariableDeclaration(node) ? 'Variable' : 'Unknown'
  }

  if (/^use[A-Z]/.test(name)) {
    return 'Hook'
  }
  if (/^[A-Z]/.test(name) && containsJsx(fn)) {
    return 'FunctionalComponent'
  }
  return 'Function'
}
