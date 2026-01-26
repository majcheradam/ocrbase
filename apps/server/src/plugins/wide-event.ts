import { Elysia } from "elysia";
import { nanoid } from "nanoid";

import { envContext } from "../lib/env-context";
import { WideEventContext } from "../lib/wide-event";
import { logger } from "./logging";

const createRequestId = (): string => `req_${nanoid(12)}`;

export const wideEventPlugin = new Elysia({ name: "wideEvent" })
  .derive({ as: "global" }, ({ request }) => {
    const url = new URL(request.url);
    const requestId = createRequestId();
    const wideEvent = new WideEventContext({
      env: envContext,
      method: request.method,
      path: url.pathname,
      requestId,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return { requestId, wideEvent };
  })
  .onAfterHandle({ as: "global" }, ({ requestId, set, wideEvent }) => {
    if (!wideEvent || !requestId) {
      return;
    }
    set.headers["X-Request-Id"] = requestId;
    const statusCode =
      typeof set.status === "number" ? set.status : Number(set.status) || 200;
    logger.info(wideEvent.finalize(statusCode));
  })
  .onError({ as: "global" }, ({ error, requestId, set, wideEvent }) => {
    if (!wideEvent || !requestId) {
      return;
    }
    set.headers["X-Request-Id"] = requestId;
    wideEvent.setError(error);
    const statusCode =
      typeof set.status === "number" ? set.status : Number(set.status) || 500;
    logger.error(wideEvent.finalize(statusCode));
  });
