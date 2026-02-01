/**
 * Generates OpenAPI spec at build time for production caching.
 * This script creates the app with dynamic OpenAPI generation
 * and outputs the spec to dist/openapi.json.
 */
import { cors } from "@elysiajs/cors";
import { openapi, fromTypes } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import path from "node:path";

import { authRoutes } from "../src/modules/auth";
import { extractRoutes } from "../src/modules/extract";
import { healthRoutes } from "../src/modules/health";
import { jobsRoutes } from "../src/modules/jobs";
import { JobModel } from "../src/modules/jobs/model";
import { jobsWebSocket } from "../src/modules/jobs/websocket";
import { keysRoutes } from "../src/modules/keys";
import { KeyModel } from "../src/modules/keys/model";
import { parseRoutes } from "../src/modules/parse";
import { schemasRoutes } from "../src/modules/schemas";
import { SchemaModel } from "../src/modules/schemas/model";

// Build a minimal app just for OpenAPI generation (no plugins that require env)
const app = new Elysia()
  .model({
    "job.create": JobModel.CreateJobBody,
    "job.createFromUrl": JobModel.CreateJobFromUrl,
    "job.listQuery": JobModel.ListJobsQuery,
    "job.listResponse": JobModel.ListJobsResponse,
    "job.response": JobModel.JobResponse,
    "key.create": KeyModel.createBody,
    "key.createResponse": KeyModel.createResponse,
    "key.listResponse": KeyModel.listResponse,
    "key.response": KeyModel.response,
    "key.usageResponse": KeyModel.usageResponse,
    "schema.create": SchemaModel.createBody,
    "schema.generate": SchemaModel.generateBody,
    "schema.generateResponse": SchemaModel.generateResponse,
    "schema.listResponse": SchemaModel.listResponse,
    "schema.response": SchemaModel.response,
    "schema.update": SchemaModel.updateBody,
  })
  .use(
    openapi({
      documentation: {
        info: {
          description:
            "API for OCR document processing and structured data extraction",
          title: "ocrbase API",
          version: "1.0.0",
        },
        servers: [
          { description: "Production", url: "https://api.ocrbase.dev" },
          { description: "Local development", url: "http://localhost:3000" },
        ],
        tags: [
          { description: "Health check endpoints", name: "Health" },
          { description: "Authentication endpoints", name: "Auth" },
          { description: "Organization management", name: "Organization" },
          { description: "Document parsing (OCR to markdown)", name: "Parse" },
          { description: "Structured data extraction", name: "Extract" },
          { description: "OCR job management", name: "Jobs" },
          { description: "API key management", name: "Keys" },
          { description: "Extraction schema management", name: "Schemas" },
        ],
      },
      path: "/openapi",
      references: fromTypes("src/index.ts", {
        projectRoot: path.resolve(import.meta.dir, ".."),
      }),
    })
  )
  .use(cors())
  .use(authRoutes)
  .use(healthRoutes)
  .use(parseRoutes)
  .use(extractRoutes)
  .use(jobsRoutes)
  .use(keysRoutes)
  .use(schemasRoutes)
  .use(jobsWebSocket);

// Generate the OpenAPI spec from /openapi/json endpoint
const response = await app.handle(new Request("http://localhost/openapi/json"));
const spec = await response.json();

await Bun.write("dist/openapi.json", JSON.stringify(spec, null, 2));
console.log("OpenAPI spec generated at dist/openapi.json");
