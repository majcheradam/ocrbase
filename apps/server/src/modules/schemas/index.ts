import { db } from "@ocrbase/db";
import { jobs } from "@ocrbase/db/schema/jobs";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { requireAuth } from "../../plugins/auth";
import { SchemaModel } from "./model";
import { SchemaService } from "./service";

const formatSchemaResponse = (schema: {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  description: string | null;
  jsonSchema: unknown;
  sampleJobId: string | null;
  generatedBy: string | null;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  createdAt: schema.createdAt.toISOString(),
  description: schema.description,
  generatedBy: schema.generatedBy,
  id: schema.id,
  jsonSchema: schema.jsonSchema as Record<string, unknown>,
  lastUsedAt: schema.lastUsedAt?.toISOString() ?? null,
  name: schema.name,
  organizationId: schema.organizationId,
  sampleJobId: schema.sampleJobId,
  updatedAt: schema.updatedAt.toISOString(),
  usageCount: schema.usageCount,
  userId: schema.userId,
});

const getErrorMessage = (caught: unknown, fallback: string): string =>
  caught instanceof Error ? caught.message : fallback;

export const schemasRoutes = new Elysia({ prefix: "/api/schemas" })
  .use(requireAuth)
  .post(
    "/",
    async ({ body, user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const schema = await SchemaService.create(
          organization.id,
          user.id,
          body
        );

        if (!schema) {
          set.status = 500;
          return { message: "Failed to create schema" };
        }

        return formatSchemaResponse(schema);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to create schema") };
      }
    },
    {
      body: SchemaModel.createBody,
      detail: {
        description: "Create a new extraction schema",
        tags: ["Schemas"],
      },
    }
  )
  .get(
    "/",
    async ({ user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const schemasList = await SchemaService.list(organization.id, user.id);
        return schemasList.map(formatSchemaResponse);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to list schemas") };
      }
    },
    {
      detail: {
        description: "List all extraction schemas",
        tags: ["Schemas"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const schema = await SchemaService.getById(
          organization.id,
          user.id,
          params.id
        );

        if (!schema) {
          set.status = 404;
          return { message: "Schema not found" };
        }

        return formatSchemaResponse(schema);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to get schema") };
      }
    },
    {
      detail: {
        description: "Get schema details",
        tags: ["Schemas"],
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const schema = await SchemaService.update(
          organization.id,
          user.id,
          params.id,
          body
        );

        if (!schema) {
          set.status = 404;
          return { message: "Schema not found" };
        }

        return formatSchemaResponse(schema);
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to update schema") };
      }
    },
    {
      body: SchemaModel.updateBody,
      detail: {
        description: "Update a schema",
        tags: ["Schemas"],
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        const deleted = await SchemaService.delete(
          organization.id,
          user.id,
          params.id
        );

        if (!deleted) {
          set.status = 404;
          return { message: "Schema not found" };
        }

        return { success: true };
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to delete schema") };
      }
    },
    {
      detail: {
        description: "Delete a schema",
        tags: ["Schemas"],
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/generate",
    async ({ body, user, organization, set }) => {
      if (!user || !organization) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      try {
        let markdown: string;
        let sampleJobId: string | undefined;

        if (body.jobId) {
          const [job] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, body.jobId));

          if (!job) {
            set.status = 404;
            return { message: "Job not found" };
          }

          if (job.organizationId !== organization.id) {
            set.status = 403;
            return { message: "Access denied" };
          }

          if (!job.markdownResult) {
            set.status = 400;
            return {
              message:
                "Job has not been processed yet or has no markdown result",
            };
          }

          markdown = job.markdownResult;
          sampleJobId = job.id;
        } else {
          set.status = 400;
          return {
            message:
              "Either jobId or file must be provided. File upload not yet supported.",
          };
        }

        const result = await SchemaService.generate(
          organization.id,
          user.id,
          markdown,
          body.hints,
          sampleJobId
        );

        return result;
      } catch (error) {
        set.status = 500;
        return { message: getErrorMessage(error, "Failed to generate schema") };
      }
    },
    {
      body: SchemaModel.generateBody,
      detail: {
        description: "Generate a schema from a parsed document using AI",
        tags: ["Schemas"],
      },
    }
  );
