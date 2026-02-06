import { Elysia, t } from "elysia";

import { ExampleUrls, FileConstraints } from "@/lib/openapi";
import { createJobHandler, getWideEvent } from "@/modules/jobs/shared";
import { requireAuth } from "@/plugins/auth";

export const parseRoutes = new Elysia({ prefix: "/v1/parse" })
  .use(requireAuth)
  .post(
    "/",
    (ctx) => {
      const wideEvent = getWideEvent(ctx);
      return createJobHandler(ctx, wideEvent, { type: "parse" });
    },
    {
      body: t.Object(
        {
          file: t.Optional(
            t.File({
              description: `Document file to parse. Max size: ${FileConstraints.maxSize}. Supported formats: PDF, PNG, JPEG, WebP, TIFF.`,
            })
          ),
          url: t.Optional(
            t.String({
              description: "URL of the document to parse (PDF or image)",
              examples: [ExampleUrls.document],
              format: "uri",
            })
          ),
        },
        {
          description:
            "Provide either a file upload or a URL. If both are provided, the file takes precedence.",
        }
      ),
      detail: {
        description: `Parse a document to markdown using OCR.

Upload a file or provide a URL to a PDF/image document. The document will be processed using vision-based OCR and converted to clean markdown.

**Supported formats:** PDF, PNG, JPEG, WebP, TIFF
**Max file size:** ${FileConstraints.maxSize}

Returns a job object. Poll the job status or use WebSocket for real-time updates.`,
        responses: {
          202: { description: "Job accepted for processing" },
          400: { description: "Bad Request - No file or URL provided" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          413: { description: "Payload Too Large - File exceeds 50MB limit" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Parse"],
      },
    }
  );
