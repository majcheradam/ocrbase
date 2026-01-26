# ocrbase

Document parsing/OCR monorepo built with Better-T-Stack (TanStack Start + Elysia + Drizzle).

## Stack

- **Package manager**: bun (Turborepo workspaces)
- **Frontend**: `apps/web/` - TanStack Start
- **Backend**: `apps/server/` - Elysia
- **Auth**: Better Auth (`packages/auth/`)
- **DB**: Drizzle + Turso (`packages/db/`)

## Commands

- `bun x ultracite fix` - Format/lint code
- `bun check-types` - Type check

Note: Developer always has `bun dev` running in a separate terminal.

For database operations, see .claude/docs/DATABASE.md
For git workflow, see .claude/docs/GIT.md
For TypeScript conventions, see .claude/docs/TYPESCRIPT.md

## Plan Mode

- Make plans extremely concise. Sacrifice grammar for concision.
- End each plan with unresolved questions, if any.

## Tracer Bullets

When building features, build a tiny end-to-end slice first, seek feedback, then expand.
