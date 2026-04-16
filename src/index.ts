import { Elysia } from "elysia";
import { env } from "./env";
import { openapi } from "./lib/openapi";
import { telemetry } from "./lib/telemetry";
import { healthModule } from "./modules/health";
import { parseModule, asyncParseModule } from "./modules/parse";
import { extractModule, asyncExtractModule } from "./modules/extract";

const app = new Elysia()
  .use(telemetry)
  .use(openapi)
  .get(
    "/",
    (): { message: string } => ({
      message: `Welcome to the OCRBase API! Documentation is available at http://${app.server?.hostname}:${app.server?.port}/v1/openapi`,
    }),
    { detail: { hide: true } },
  )
  .group("/v1", (router) => {
    router.use(healthModule).use(parseModule).use(extractModule);
    if (asyncParseModule) {
      router.use(asyncParseModule);
    }
    if (asyncExtractModule) {
      router.use(asyncExtractModule);
    }
    return router;
  });

if (env.REDIS_URL) {
  const { jobModule } = await import("./modules/job");
  const { serverAdapter } = await import("./lib/bullboard");
  app.group("/v1", (router) => router.use(jobModule));
  app.use(await serverAdapter.registerPlugin());
}

app.listen(env.PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/v1/health\n📖 OpenAPI docs at http://${app.server?.hostname}:${app.server?.port}/v1/openapi${env.S3_ENDPOINT ? `\n🪣  S3 storage at ${env.S3_ENDPOINT}` : ""}${env.REDIS_URL ? `\n🎯 Bull Board at http://${app.server?.hostname}:${app.server?.port}/v1/queues` : ""}`,
);
