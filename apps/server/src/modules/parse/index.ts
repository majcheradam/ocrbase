import { Elysia, t } from "elysia";

import { requireAuth } from "../../plugins/auth";
import { createJobHandler, getWideEvent } from "../jobs/shared";

export const parseRoutes = new Elysia({ prefix: "/api/parse" })
  .use(requireAuth)
  .post(
    "/",
    (ctx) => {
      const wideEvent = getWideEvent(ctx);
      return createJobHandler(ctx, wideEvent, { type: "parse" });
    },
    {
      body: t.Object({
        file: t.Optional(t.File()),
        llmModel: t.Optional(t.String()),
        llmProvider: t.Optional(t.String()),
        url: t.Optional(t.String()),
      }),
    }
  );
