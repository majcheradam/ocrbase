import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { env } from "../env";
import { parseQueue, extractQueue } from "./bullmq";

export const serverAdapter = new ElysiaAdapter({
  basePath: "/v1/queues",
  prefix: "/v1/queues",
});

if (env.REDIS_URL && parseQueue && extractQueue) {
  const queues = [new BullMQAdapter(parseQueue), new BullMQAdapter(extractQueue)];
  createBullBoard({
    options: {
      uiBasePath: `${process.cwd()}/node_modules/@bull-board/ui`,
    },
    queues,
    serverAdapter,
  });
}
