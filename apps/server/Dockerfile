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

# Build the server binary
WORKDIR /app/apps/server
RUN bun run compile

# Production stage - using distroless for minimal attack surface
FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/apps/server/server /app/server

# Expose port
EXPOSE 3000

# Run the server
CMD ["./server"]
