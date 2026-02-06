import { Elysia, t } from "elysia";

import { requireAuth } from "@/plugins/auth";

import { JobService } from "./service";
import { formatJobResponse, getErrorMessage, getWideEvent } from "./shared";

export const jobsRoutes = new Elysia({ prefix: "/v1/jobs" })
  .use(requireAuth)
  .get(
    "/",
    async ({ organization, query, set, user }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const result = await JobService.list(organization.id, user.id, {
          limit: query.limit,
          page: query.page,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          status: query.status,
          type: query.type,
        });

        return {
          data: result.data.map(formatJobResponse),
          pagination: result.pagination,
        };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to list jobs") };
      }
    },
    {
      detail: {
        description: `List all jobs with filtering, sorting, and pagination.

Filter by status (pending, processing, extracting, completed, failed) or type (parse, extract).
Results are paginated with configurable page size (max 100).`,
        responses: {
          200: { description: "List of jobs with pagination metadata" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Jobs"],
      },
      query: t.Object({
        limit: t.Optional(
          t.Numeric({
            default: 20,
            description: "Number of results per page (1-100)",
            examples: [20],
            maximum: 100,
            minimum: 1,
          })
        ),
        page: t.Optional(
          t.Numeric({
            default: 1,
            description: "Page number",
            examples: [1],
            minimum: 1,
          })
        ),
        sortBy: t.Optional(
          t.Union([t.Literal("createdAt"), t.Literal("updatedAt")], {
            description: "Field to sort by",
            examples: ["createdAt"],
          })
        ),
        sortOrder: t.Optional(
          t.Union([t.Literal("asc"), t.Literal("desc")], {
            description: "Sort direction",
            examples: ["desc"],
          })
        ),
        status: t.Optional(
          t.Union(
            [
              t.Literal("pending"),
              t.Literal("processing"),
              t.Literal("extracting"),
              t.Literal("completed"),
              t.Literal("failed"),
            ],
            {
              description: "Filter by job status",
              examples: ["completed"],
            }
          )
        ),
        type: t.Optional(
          t.Union([t.Literal("parse"), t.Literal("extract")], {
            description: "Filter by job type",
            examples: ["parse"],
          })
        ),
      }),
    }
  )
  .get(
    "/:id",
    async (ctx) => {
      const { organization, params, set, user } = ctx;
      const wideEvent = getWideEvent(ctx);

      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const job = await JobService.getById(
          organization.id,
          user.id,
          params.id
        );

        if (!job) {
          set.status = 404;
          return { message: "Job not found" };
        }

        wideEvent?.setJob({
          id: job.id,
          pageCount: job.pageCount ?? undefined,
          status: job.status,
          type: job.type,
        });

        return formatJobResponse(job);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to get job") };
      }
    },
    {
      detail: {
        description: `Get detailed information about a specific job.

Returns job status, metadata, processing times, and results (if completed).
For completed jobs, includes markdownResult and jsonResult (if extraction schema was used).`,
        responses: {
          200: { description: "Job details" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - Job does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String({
          description: "Job ID",
          examples: ["job_abc123xyz"],
          pattern: "^job_[a-zA-Z0-9_-]+$",
        }),
      }),
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
      const { organization, params, set, user } = ctx;
      const wideEvent = getWideEvent(ctx);

      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const job = await JobService.getById(
          organization.id,
          user.id,
          params.id
        );

        if (!job) {
          set.status = 404;
          return { message: "Job not found" };
        }

        wideEvent?.setJob({ id: job.id, type: job.type });

        await JobService.delete(organization.id, user.id, params.id);

        return { success: true };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to delete job") };
      }
    },
    {
      detail: {
        description: `Permanently delete a job and all associated data.

This action cannot be undone. Deletes the job record, uploaded file, and any generated results.`,
        responses: {
          200: { description: "Job deleted successfully" },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - Job does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String({
          description: "Job ID",
          examples: ["job_abc123xyz"],
          pattern: "^job_[a-zA-Z0-9_-]+$",
        }),
      }),
    }
  )
  .get(
    "/:id/download",
    async (ctx) => {
      const { organization, params, query, set, user } = ctx;
      const wideEvent = getWideEvent(ctx);

      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const format = query.format ?? "md";
        const { content, contentType, fileName } =
          await JobService.getDownloadContent(
            organization.id,
            user.id,
            params.id,
            format
          );

        wideEvent?.setJob({ id: params.id });

        set.headers["Content-Type"] = contentType;
        set.headers["Content-Disposition"] =
          `attachment; filename="${fileName}"`;

        return content;
      } catch (error) {
        set.status = 500;
        return {
          message: getErrorMessage(error, "Failed to download job result"),
        };
      }
    },
    {
      detail: {
        description: `Download the job result as a file.

Choose between markdown (.md) or JSON (.json) format. JSON format is only available for jobs with extraction schemas.`,
        responses: {
          200: { description: "File download (markdown or JSON)" },
          400: {
            description:
              "Bad Request - Job not completed or JSON not available",
          },
          401: { description: "Unauthorized - Invalid or missing API key" },
          404: { description: "Not Found - Job does not exist" },
          429: { description: "Too Many Requests - Rate limit exceeded" },
          500: { description: "Internal Server Error" },
        },
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String({
          description: "Job ID",
          examples: ["job_abc123xyz"],
          pattern: "^job_[a-zA-Z0-9_-]+$",
        }),
      }),
      query: t.Object({
        format: t.Optional(
          t.Union([t.Literal("md"), t.Literal("json")], {
            default: "md",
            description: "Download format",
            examples: ["md"],
          })
        ),
      }),
    }
  );
