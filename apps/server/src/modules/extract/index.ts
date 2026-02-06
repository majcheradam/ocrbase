import { Elysia, t } from "elysia";

import { ExampleUrls, FileConstraints } from "@/lib/openapi";
import { createJobHandler, getWideEvent } from "@/modules/jobs/shared";
import { requireAuth } from "@/plugins/auth";

export const extractRoutes = new Elysia({ prefix: "/v1/extract" })
  .use(requireAuth)
  .post(
    "/",
    (ctx) => {
      const wideEvent = getWideEvent(ctx);
      return createJobHandler(ctx, wideEvent, { type: "extract" });
    },
    {
      body: t.Object(
        {
          file: t.Optional(
            t.File({
              description: `Document file to extract data from. Max size: ${FileConstraints.maxSize}. Supported formats: PDF, PNG, JPEG, WebP, TIFF.`,
            })
          ),
          hints: t.Optional(
            t.String({
              description:
                "Additional context or instructions for the extraction (e.g., 'Focus on the table in the middle of the document')",
              examples: ["Extract all author names and affiliations"],
              maxLength: 2000,
            })
          ),
          schemaId: t.Optional(
            t.String({
              description:
                "ID of a saved extraction schema. If not provided, returns raw markdown.",
              examples: ["sch_abc123xyz"],
              pattern: "^sch_[a-zA-Z0-9_-]+$",
            })
          ),
          url: t.Optional(
            t.String({
              description: "URL of the document to extract data from",
              examples: [ExampleUrls.document],
              format: "uri",
            })
          ),
        },
        {
          description:
            "Provide either a file upload or a URL. Optionally include a schemaId for structured extraction.",
        }
      ),
      detail: {
        description: `Extract structured data from a document using AI.

Upload a file or provide a URL, then optionally specify a schema to extract structured JSON data. Without a schema, returns parsed markdown.

**Supported formats:** PDF, PNG, JPEG, WebP, TIFF
**Max file size:** ${FileConstraints.maxSize}

Returns a job object with both markdown and JSON results (if schema provided).`,
        responses: {
          202: { description: "Job accepted for processing" },
          400: {
            description: "Bad Request - No file/URL provided or invalid schema",
          },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - Schema not found" },
          413: { description: "Payload Too Large - File exceeds 50MB limit" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Extract"],
      },
    }
  );
