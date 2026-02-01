import { env } from "@ocrbase/env/server";

import { app, type App } from "./app";
import { shutdownPosthog } from "./lib/posthog";

const startServer = (): void => {
  app.listen(env.PORT, () => {
    console.info(`Server is running on http://${env.HOST}:${env.PORT}`);
    console.info(
      `OpenAPI docs available at http://${env.HOST}:${env.PORT}/openapi`
    );
  });
};

const shutdown = async () => {
  await app.stop();
  await shutdownPosthog();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();

export type { App };
