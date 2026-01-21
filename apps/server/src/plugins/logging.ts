import { env } from "@ocrbase/env/server";
import pino from "pino";

import { envContext } from "../lib/env-context";

export const logger = pino(
  {
    base: {
      env: envContext,
      service: envContext.service,
    },
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
  pino.destination(1)
);
