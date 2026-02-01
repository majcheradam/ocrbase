# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY packages/paddleocr-vl-ts/package.json ./packages/paddleocr-vl-ts/

# Install dependencies
RUN bun install --ignore-scripts

# Copy source code
COPY . .

# Build the server binary and generate OpenAPI spec
WORKDIR /app/apps/server
# Dummy env vars for build-time OpenAPI generation (not used at runtime)
ENV BETTER_AUTH_SECRET=build-time-dummy-secret-at-least-32-chars \
    BETTER_AUTH_URL=http://localhost:3000 \
    CORS_ORIGINS=http://localhost:3000 \
    DATABASE_URL=postgresql://x:x@localhost/x
RUN mkdir -p dist && bun run ./scripts/generate-openapi.ts && bun run compile

# Production stage - minimal distroless image
FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /app

# Copy the compiled binaries and pre-generated OpenAPI spec
COPY --from=builder /app/apps/server/server /app/server
COPY --from=builder /app/apps/server/worker /app/worker
COPY --from=builder /app/apps/server/dist/openapi.json /app/apps/server/dist/openapi.json

# Expose port
EXPOSE 3000

# Default to server (override with CMD ["./worker"] for worker)
CMD ["./server"]
