import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "@ocrbase/auth";
import { env } from "@ocrbase/env/server";
import { Elysia } from "elysia";

import { healthRoutes } from "./modules/health";
import { jobsRoutes } from "./modules/jobs";
import { jobsWebSocket } from "./modules/jobs/websocket";
import { keysRoutes } from "./modules/keys";
import { schemasRoutes } from "./modules/schemas";
import { errorHandlerPlugin } from "./plugins/errorHandler";
import { rateLimitPlugin } from "./plugins/rateLimit";
import { securityPlugin } from "./plugins/security";
import { wideEventPlugin } from "./plugins/wide-event";

export const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          description:
            "API for OCR document processing and structured data extraction",
          title: "OCRBase API",
          version: "1.0.0",
        },
        tags: [
          { description: "Health check endpoints", name: "Health" },
          { description: "Authentication endpoints", name: "Auth" },
          { description: "OCR job management", name: "Jobs" },
          { description: "API key management", name: "Keys" },
          { description: "Extraction schema management", name: "Schemas" },
        ],
      },
      path: "/openapi",
    })
  )
  .use(
    cors({
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      origin: env.CORS_ORIGIN,
    })
  )
  .use(securityPlugin)
  .use(wideEventPlugin)
  .use(rateLimitPlugin)
  .use(errorHandlerPlugin)
  .all("/api/auth/*", (context) => auth.handler(context.request))
  .use(healthRoutes)
  .use(jobsRoutes)
  .use(keysRoutes)
  .use(schemasRoutes)
  .use(jobsWebSocket);

export type App = typeof app;
