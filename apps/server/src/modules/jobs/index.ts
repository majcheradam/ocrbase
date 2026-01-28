import { Elysia, t } from "elysia";

import { requireAuth } from "../../plugins/auth";
import { JobService } from "./service";
import { formatJobResponse, getErrorMessage, getWideEvent } from "./shared";

export const jobsRoutes = new Elysia({ prefix: "/api/jobs" })
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
        description: "List jobs with filtering, sorting, and pagination",
        tags: ["Jobs"],
      },
      query: t.Object({
        limit: t.Optional(t.Numeric({ default: 20, maximum: 100, minimum: 1 })),
        page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
        sortBy: t.Optional(
          t.Union([t.Literal("createdAt"), t.Literal("updatedAt")])
        ),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        status: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("processing"),
            t.Literal("extracting"),
            t.Literal("completed"),
            t.Literal("failed"),
          ])
        ),
        type: t.Optional(t.Union([t.Literal("parse"), t.Literal("extract")])),
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
        description: "Get job details and status",
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String(),
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

        return { message: "Job deleted successfully" };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to delete job") };
      }
    },
    {
      detail: {
        description: "Delete a job and its associated data",
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String(),
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
        description: "Download job result as markdown or JSON",
        tags: ["Jobs"],
      },
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        format: t.Optional(t.Union([t.Literal("md"), t.Literal("json")])),
      }),
    }
  );
