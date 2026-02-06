# API Versioning Plan (ocrbase)

## Context
- API will live on `https://api.ocrbase.dev` (API subdomain).
- Goal: remove `/api` prefix and introduce `/v1` versioning in paths.
- Align with OpenAI-style conventions (per user request):
  - REST paths under `/v1/...`.
  - Realtime WebSocket path under `/v1/realtime` with query param for job ID.
  - Auth via `Authorization: Bearer ...` header (no query param).
  - One job per WebSocket connection.
  - WebSocket messages use a consistent `type` + `data` envelope.
- `/openapi` and `/openapi/json` must remain **pre-rendered** and **unversioned**.
- Hard cutover: **no backward compatibility** for existing `/api/*` or `/ws/*` routes.

## Confirmed Decisions (OpenAI-style)
- REST paths: `/v1/...`
- Realtime WebSocket path: `/v1/realtime?job_id=...` (job updates stream)
- Auth paths: `/v1/auth/...` (versioned alongside REST)
- Health paths: `/v1/health`
- SDK base URL default: `https://api.ocrbase.dev` (SDK uses `/v1/...` paths)
- OpenAPI endpoints remain unversioned: `/openapi` and `/openapi/json` (pre-rendered)

## Files That Will Likely Change
Server routing and OpenAPI
- `apps/server/src/app.ts`
- `apps/server/scripts/generate-openapi.ts`
- `apps/server/src/modules/auth/index.ts`
- `apps/server/src/modules/parse/index.ts`
- `apps/server/src/modules/extract/index.ts`
- `apps/server/src/modules/jobs/index.ts`
- `apps/server/src/modules/keys/index.ts`
- `apps/server/src/modules/schemas/index.ts`
- `apps/server/src/modules/health/index.ts`
- `apps/server/src/modules/jobs/websocket.ts`

Tests
- `apps/server/src/tests/parse.test.ts`

Docs
- `docs/SELF_HOSTING.md`
- `README.md`

Auth config (may need base-path support)
- `packages/auth/src/index.ts`

## Plan

### Phase 1: Confirm semantics and finalize routing decisions
- [x] `/v1/realtime` is **job updates** via `?job_id=...` (one job per connection).
- [x] Auth endpoints are versioned: `/v1/auth/...`.
- [x] Health endpoints are versioned: `/v1/health`.
- [x] Confirm Better Auth handler supports base path `/v1/auth` and set `basePath`.

### Phase 2: Update server routes and OpenAPI
- [x] Change all REST route prefixes from `/api/...` to `/v1/...`.
- [x] Update auth docs routes to `/v1/auth/...`.
- [x] Update WebSocket route from `/ws/jobs/:jobId` to `/v1/realtime?job_id=...`.
- [x] Enforce one job per connection and standard `type` + `data` envelope in WS messages.
- [x] Ensure `/openapi` and `/openapi/json` remain pre-rendered and unversioned in `apps/server/src/app.ts`.
- [x] Update OpenAPI generation (`apps/server/scripts/generate-openapi.ts`) so the spec paths reflect `/v1/...`.
- [x] Update OpenAPI `servers` if needed (kept `https://api.ocrbase.dev` without `/v1`).

### Phase 3: Update tests
- [x] Update server tests (e.g., `apps/server/src/tests/parse.test.ts`) to use `/v1/...` and `/v1/realtime`.

### Phase 4: Documentation updates
- [x] Update `docs/SELF_HOSTING.md` to list `/v1/...` endpoints.
- [x] Update `README.md` examples to `/v1/...`.
- [x] Ensure `/openapi` docs mention that the spec is pre-rendered and unversioned.

### Phase 5: Validation
- [ ] Run targeted tests or smoke checks to verify:
  - `/v1/...` REST endpoints respond.
  - `/v1/realtime` WebSocket connects and streams updates per chosen semantics.
  - `/openapi` and `/openapi/json` serve pre-rendered content.

## Notes / Risks
- Better Auth’s base path may default to `/api/auth`; confirm config supports `/v1/auth` to avoid mismatched handler routes.
