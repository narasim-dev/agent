# TypeScript Dir Analyzer

Three GraphQL queries backed by a fresh `ts.Program` built from the project's
`tsconfig.json`. Use them to navigate and inspect the codebase from an agent.

All paths are POSIX, relative to the repository root (the folder containing
`tsconfig.json`). Absolute paths and paths escaping the project are rejected.

---

## `analyzeDir(projectRoot: String!, rootDir: String): Json`

List source files in a subtree.

**Args**

- `projectRoot` (required) — absolute path to the project root directory
  (the folder containing `tsconfig.json`).
- `rootDir` (optional) — folder relative to the project root. Empty/omitted
  means the whole project.

**Returns**

```json
{
  "rootDir": "src/components",
  "count": 42,
  "files": [{ "path": "src/components/Auth/Auth.tsx" }, ...]
}
```

Excludes `node_modules` and `*.d.ts`.

**Example**

```graphql
query analyzeDir {
  analyzeDir(projectRoot: "/home/user/my-project", rootDir: "src/components")
}
```

---

## `analyzeFile(projectRoot: String!, path: String!): TsModule`

Per-file structural info: top-level exports and imports.

**Args**

- `projectRoot` (required) — absolute path to the project root directory.
- `path` (required) — file path relative to the project root.

**Returns**

```json
{
  "path": "src/components/Auth/Auth.tsx",
  "exports": [
    { "name": "Auth", "kind": "FunctionalComponent", "line": 10, "jsdoc": "..." }
  ],
  "imports": [
    {
      "module": "react",
      "resolvedPath": null,
      "default": "React",
      "namespace": null,
      "named": [{ "name": "useState" }]
    },
    {
      "module": "./useAuth",
      "resolvedPath": "src/components/Auth/useAuth.ts",
      "named": [{ "name": "useAuth" }]
    }
  ]
}
```

`kind` values for exports: `FunctionalComponent`, `Hook`, `Function`, `Class`,
`Variable`, `Type`, `Interface`, `Enum`, `Unknown`. Heuristics:

- name starts with `use` + capital letter → `Hook`;
- PascalCase + body returns JSX → `FunctionalComponent`;
- otherwise the syntactic kind of the declaration.

Cross-file usage is **not** computed here — see `analyzeEntity` for callable
details.

**Example**

```graphql
query analyzeFile {
  analyzeFile(projectRoot: "/home/user/my-project", path: "src/components/Auth/Auth.tsx") {
    path
    exports
    imports {
      module
      resolvedPath
      default
      namespace
      isExternalLibraryImport
      named {
        name
        alias
      }
    }
  }
}
```

---

## `analyzeEntity(projectRoot: String!, path: String!, name: String!): Json`

Detailed information about a single top-level declaration. Useful to figure
out whether something is a React component or a hook, what arguments it
accepts, and what it returns.

**Returns**

```json
{
  "path": "src/components/Auth/useAuth.ts",
  "name": "useAuth",
  "kind": "Hook",
  "line": 12,
  "exported": true,
  "jsdoc": "Returns the current authenticated user.",
  "signature": "(options?: UseAuthOptions): UseAuthResult",
  "returnType": "UseAuthResult",
  "parameters": [
    {
      "name": "options",
      "type": "UseAuthOptions | undefined",
      "optional": true,
      "hasDefault": false
    }
  ]
}
```

For non-callable kinds (`Type`, `Interface`, `Enum`, `Variable`) the
`signature`, `returnType` and `parameters` fields are omitted.

**Args**

- `projectRoot` (required) — absolute path to the project root directory.
- `path` (required) — file path relative to the project root.
- `name` (required) — name of the top-level declaration to inspect.

**Example**

```graphql
query analyzeEntity {
  analyzeEntity(
    projectRoot: "/home/user/my-project"
    path: "src/components/Auth/useAuth.ts"
    name: "useAuth"
  )
}
```

---

## Notes

- Programs are cached per project and rebuilt incrementally when source files
  change. Cache entries expire after 30 minutes of inactivity.
- Multiple projects can be analyzed simultaneously — each `projectRoot` gets
  its own cached `ts.Program`.
- Only top-level declarations are visible. Symbols nested inside other
  declarations are not exposed.
