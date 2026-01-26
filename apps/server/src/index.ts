import { env } from "@ocrbase/env/server";

import { app, type App } from "./app";

const startServer = (): void => {
  app.listen(env.PORT, () => {
    console.info(`Server is running on http://${env.HOST}:${env.PORT}`);
    console.info(
      `OpenAPI docs available at http://${env.HOST}:${env.PORT}/openapi`
    );
  });
};

startServer();

export type { App };
