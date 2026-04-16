import { Elysia, t } from "elysia";
import { Worker } from "bullmq";
import type { Job } from "bullmq";

import { resolveDocumentInput } from "../lib/file";
import { getModel } from "../lib/models";
import type { ParseResult, ModelId } from "../lib/models";
import { redis, parseQueue, parseQueueEvents } from "../lib/bullmq";

export interface ParseDocumentInput {
  model: ModelId;
  file: URL | string;
}

export async function parseDocument({ model, file }: ParseDocumentInput): Promise<ParseResult> {
  const documentModel = getModel(model);
  return await documentModel.parse(file);
}

export const parseWorker = redis
  ? new Worker<ParseDocumentInput, ParseResult>(
      "parse",
      async (job: Job<ParseDocumentInput>) => await parseDocument(job.data),
      { connection: redis },
    )
  : null;

export const parseModule = new Elysia().post(
  "/parse",
  async function parse({ body }) {
    const file = await resolveDocumentInput(body.file);
    if (parseQueue && parseQueueEvents) {
      const job = await parseQueue.add(
        "parse",
        {
          file,
          model: body.model,
        },
        { jobId: crypto.randomUUID() },
      );
      return await job.waitUntilFinished(parseQueueEvents);
    }
    return await parseDocument({
      file,
      model: body.model,
    });
  },
  {
    body: t.Object({
      file: t.Union([t.File(), t.String()]),
      model: t.UnionEnum(["glm-ocr", "paddleocr"], { default: "paddleocr" }),
    }),
    detail: {
      summary: "Parse",
    },
  },
);

const _parseQueue = parseQueue;

export const asyncParseModule = _parseQueue
  ? new Elysia().post(
      "/parse/async",
      async function parseAsync({ body }) {
        const file = await resolveDocumentInput(body.file);
        const job = await _parseQueue.add(
          "parse",
          {
            file,
            model: body.model,
          },
          { jobId: crypto.randomUUID() },
        );
        return { job_id: job.id };
      },
      {
        body: t.Object({
          file: t.Union([t.File(), t.String()]),
          model: t.UnionEnum(["glm-ocr", "paddleocr"], {
            default: "paddleocr",
          }),
        }),
        detail: {
          summary: "Parse (Async)",
        },
      },
    )
  : null;
