---
name: DB package rebuild
description: How and when to rebuild the @workspace/db declaration files for TypeScript project references.
---

The `@workspace/db` package uses TypeScript project references (`composite: true` in tsconfig). The API server references it and needs compiled `.d.ts` files in `lib/db/dist/`.

**Why:** When `lib/db` schema files are created/changed, the dist declarations go stale. Without rebuilding, the API server typecheck fails with "Module '@workspace/db' has no exported member 'X'" even though the source exports are correct.

**How to apply:** After any schema change in `lib/db/src/schema/`, run:
```
cd lib/db && ../../node_modules/.bin/tsc -p tsconfig.json
```
This regenerates `dist/schema/*.d.ts` files. The build script in `lib/db/package.json` is `pnpm --filter @workspace/db run build`.
