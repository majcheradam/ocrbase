# Self-Hosting ocrbase

Complete guide for deploying ocrbase on your own infrastructure.

## Prerequisites

- [Bun](https://bun.sh/) installed globally
- Docker Desktop running

## Quick Start

```bash
# Clone and install
git clone https://github.com/majcheradam/ocrbase
cd ocrbase
bun install

# Copy environment file
cp .env.example .env
# Edit .env and set PADDLE_OCR_URL to your PaddleOCR instance

# Start infrastructure (postgres, redis, minio)
docker compose up -d

# Setup database
bun run db:push

# Start API server + worker
bun run dev
```

The API will be available at `http://localhost:3000`.

## PaddleOCR-VL Setup

ocrbase requires a PaddleOCR-VL service. Choose one option:

### Option 1: External URL (Recommended)

Set `PADDLE_OCR_URL` in your `.env` to point to your hosted PaddleOCR instance:

```bash
PADDLE_OCR_URL=https://your-paddleocr-instance.com
```

### Option 2: Self-Host with GPU

**Requirements:**

- NVIDIA GPU with Compute Capability >= 8.0 (RTX 30/40/50 series, A10/A100+)
- CUDA 12.6+ with NVIDIA Container Toolkit
- ~12GB VRAM recommended (works with RTX 3060 12GB)

> **Note:** GPUs with CC 7.x (T4/V100) may experience timeout or OOM issues and are not recommended.

Start everything including PaddleOCR-VL 1.5:

```bash
docker compose --profile gpu up -d
```

This will start:

- PostgreSQL, Redis, MinIO (core infrastructure)
- PaddleOCR-VL 1.5 VLM server (vLLM backend) + Pipeline API

Wait for "Application startup complete" - PaddleOCR will be available at `http://localhost:8080`.

The first startup will download models (~2GB) which may take a few minutes.

Then set in `.env`:

```bash
PADDLE_OCR_URL=http://localhost:8080
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ocrbase
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3001

# Redis
REDIS_URL=redis://localhost:6379

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=ocrbase
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# OCR Service
PADDLE_OCR_URL=https://your-paddleocr-instance.com

# Optional - LLM for data extraction (required for /api/extract)
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional - GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## API Reference

### REST Endpoints

| Method   | Endpoint                 | Description                |
| -------- | ------------------------ | -------------------------- |
| `GET`    | `/health/live`           | Liveness check             |
| `GET`    | `/health/ready`          | Readiness check            |
| `POST`   | `/api/parse`             | Parse document to markdown |
| `POST`   | `/api/extract`           | Extract structured data    |
| `GET`    | `/api/jobs`              | List jobs                  |
| `GET`    | `/api/jobs/:id`          | Get job                    |
| `DELETE` | `/api/jobs/:id`          | Delete job                 |
| `GET`    | `/api/jobs/:id/download` | Download result            |
| `POST`   | `/api/schemas`           | Create schema              |
| `GET`    | `/api/schemas`           | List schemas               |
| `GET`    | `/api/schemas/:id`       | Get schema                 |
| `PATCH`  | `/api/schemas/:id`       | Update schema              |
| `DELETE` | `/api/schemas/:id`       | Delete schema              |
| `POST`   | `/api/schemas/generate`  | AI-generate schema         |

### WebSocket

```
WS /ws/jobs/:jobId
```

Real-time job status updates. See SDK for type-safe usage.

### OpenAPI

Interactive documentation at: `http://localhost:3000/openapi`

## Project Structure

```
ocrbase/
├── apps/
│   ├── web/                 # Frontend (TanStack Start)
│   └── server/              # Backend API (Elysia)
│       ├── src/
│       │   ├── modules/     # Feature modules (jobs, schemas, health)
│       │   ├── plugins/     # Elysia plugins
│       │   ├── services/    # Core services (OCR, LLM, storage)
│       │   └── workers/     # Background job processors
├── packages/
│   ├── sdk/                 # TypeScript SDK (@ocrbase/sdk)
│   ├── auth/                # Authentication (Better-Auth)
│   ├── db/                  # Database schema (Drizzle)
│   ├── env/                 # Environment validation
│   └── paddleocr-vl-ts/     # PaddleOCR client
└── docker-compose.yml
```

## Scripts

| Command               | Description         |
| --------------------- | ------------------- |
| `bun run dev`         | Start all services  |
| `bun run dev:server`  | Start API only      |
| `bun run dev:web`     | Start frontend only |
| `bun run build`       | Build all packages  |
| `bun run check-types` | TypeScript checking |
| `bun run db:push`     | Push schema to DB   |
| `bun run db:studio`   | Open Drizzle Studio |
| `bun run db:migrate`  | Run migrations      |

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Runtime       | [Bun](https://bun.sh/)                                        |
| API Framework | [Elysia](https://elysiajs.com/)                               |
| SDK           | [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html) |
| Database      | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)         |
| Queue         | Redis + [BullMQ](https://bullmq.io/)                          |
| Storage       | S3/MinIO                                                      |
| OCR           | [PaddleOCR-VL 1.5](https://github.com/PaddlePaddle/PaddleOCR) |
| Auth          | [Better-Auth](https://better-auth.com/)                       |
| Build         | [Turborepo](https://turbo.build/)                             |
