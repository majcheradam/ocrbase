import { Elysia, t } from "elysia";

import { requireAuth } from "../../plugins/auth";
import { createJobHandler, getWideEvent } from "../jobs/shared";

export const extractRoutes = new Elysia({ prefix: "/api/extract" })
  .use(requireAuth)
  .post(
    "/",
    (ctx) => {
      const wideEvent = getWideEvent(ctx);
      return createJobHandler(ctx, wideEvent, { type: "extract" });
    },
    {
      body: t.Object({
        file: t.Optional(t.File()),
        schemaId: t.String(),
        url: t.Optional(t.String()),
      }),
      detail: {
        description: "Extract structured data from a document using a schema",
        tags: ["Extract"],
      },
    }
  );
