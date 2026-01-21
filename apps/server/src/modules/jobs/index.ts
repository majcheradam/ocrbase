import type { Job } from "@ocrbase/db/schema/jobs";

import { Elysia, t } from "elysia";

import type { WideEventContext } from "../../lib/wide-event";
import type { JobResponse } from "./model";

import { requireAuth } from "../../plugins/auth";
import { JobService } from "./service";

interface ContextWithWideEvent {
  wideEvent?: WideEventContext;
}

const getWideEvent = (ctx: unknown): WideEventContext | undefined =>
  (ctx as ContextWithWideEvent).wideEvent;

const formatJobResponse = (job: Job): JobResponse => ({
  completedAt: job.completedAt?.toISOString() ?? null,
  createdAt: job.createdAt.toISOString(),
  errorCode: job.errorCode,
  errorMessage: job.errorMessage,
  fileKey: job.fileKey,
  fileName: job.fileName,
  fileSize: job.fileSize,
  id: job.id,
  jsonResult: job.jsonResult ?? undefined,
  llmModel: job.llmModel,
  llmProvider: job.llmProvider,
  markdownResult: job.markdownResult,
  mimeType: job.mimeType,
  organizationId: job.organizationId,
  pageCount: job.pageCount,
  processingTimeMs: job.processingTimeMs,
  retryCount: job.retryCount,
  schemaId: job.schemaId,
  sourceUrl: job.sourceUrl,
  startedAt: job.startedAt?.toISOString() ?? null,
  status: job.status,
  tokenCount: job.tokenCount,
  type: job.type,
  updatedAt: job.updatedAt.toISOString(),
  userId: job.userId,
});

const getErrorMessage = (caught: unknown, fallback: string): string =>
  caught instanceof Error ? caught.message : fallback;

export const jobsRoutes = new Elysia({ prefix: "/api/jobs" })
  .use(requireAuth)
  .post(
    "/",
    async (ctx) => {
      const { body, organization, set, user } = ctx;
      const wideEvent = getWideEvent(ctx);

      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        // Check for valid URL (non-empty string that starts with http)
        const hasValidUrl =
          typeof body.url === "string" &&
          body.url.length > 0 &&
          body.url.startsWith("http");

        if (hasValidUrl && body.url) {
          const job = await JobService.createFromUrl({
            body: {
              llmModel: body.llmModel,
              llmProvider: body.llmProvider,
              schemaId: body.schemaId,
              type: body.type,
              url: body.url,
            },
            organizationId: organization.id,
            userId: user.id,
          });

          wideEvent?.setJob({
            fileSize: job.fileSize,
            id: job.id,
            mimeType: job.mimeType,
            type: job.type,
          });

          return formatJobResponse(job);
        }

        if (!("file" in body) || !body.file) {
          set.status = 400;
          return { message: "File or URL is required" };
        }

        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());

        const job = await JobService.create({
          body: {
            llmModel: body.llmModel,
            llmProvider: body.llmProvider,
            schemaId: body.schemaId,
            type: body.type,
          },
          file: {
            buffer,
            name: file.name,
            size: file.size,
            type: file.type,
          },
          organizationId: organization.id,
          userId: user.id,
        });

        wideEvent?.setJob({
          fileSize: job.fileSize,
          id: job.id,
          mimeType: job.mimeType,
          type: job.type,
        });

        return formatJobResponse(job);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to create job") };
      }
    },
    {
      body: t.Object({
        file: t.Optional(t.File()),
        llmModel: t.Optional(t.String()),
        llmProvider: t.Optional(t.String()),
        schemaId: t.Optional(t.String()),
        type: t.Union([t.Literal("parse"), t.Literal("extract")]),
        url: t.Optional(t.String()),
      }),
    }
  )
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
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        format: t.Optional(t.Union([t.Literal("md"), t.Literal("json")])),
      }),
    }
  );
