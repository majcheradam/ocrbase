import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Output, generateText, jsonSchema } from "ai";
import { Elysia, t } from "elysia";
import { Worker } from "bullmq";
import type { Job } from "bullmq";

import { env } from "../env";
import { resolveDocumentInput } from "../lib/file";
import type { ModelId } from "../lib/models";
import { redis, extractQueue, extractQueueEvents } from "../lib/bullmq";
import { parseDocument } from "./parse";

export interface ExtractDocumentInput {
  model: ModelId;
  file: URL | string;
  schema?: Record<string, unknown>;
}

export interface ExtractResult {
  json_result: unknown;
}

function strictSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (schema.type === "object" && schema.properties) {
    const properties = schema.properties as Record<string, Record<string, unknown>>;

    return {
      ...schema,
      additionalProperties: false,
      properties: Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, strictSchema(value)]),
      ),
      required: Object.keys(properties),
    };
  }

  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: strictSchema(schema.items as Record<string, unknown>),
    };
  }

  if (Array.isArray(schema.type)) {
    const types = schema.type as string[];
    const rest = Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "type"));

    return {
      anyOf: types.map((type) => strictSchema({ ...rest, type })),
    };
  }

  return schema;
}

export async function extractDocument({
  model,
  file,
  schema,
}: ExtractDocumentInput): Promise<ExtractResult> {
  const parseResult = await parseDocument({ file, model });
  const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

  if (schema) {
    const { output } = await generateText({
      model: openrouter.chat(env.OPENROUTER_MODEL),
      output: Output.object({
        schema: jsonSchema(strictSchema(schema)),
      }),
      prompt: `Please output the information in the image in the following JSON format.\n\n${parseResult.markdown_result}`,
    });

    return { json_result: output };
  }

  const { text } = await generateText({
    model: openrouter.chat(env.OPENROUTER_MODEL, {
      extraBody: { response_format: { type: "json_object" } },
    }),
    prompt: `Please output the information in the image in the following JSON format.\n\n${parseResult.markdown_result}`,
  });

  return { json_result: text };
}

export const extractWorker = redis
  ? new Worker<ExtractDocumentInput, ExtractResult>(
      "extract",
      async (job: Job<ExtractDocumentInput>) => await extractDocument(job.data),
      { concurrency: env.BULLMQ_CONCURRENCY, connection: redis },
    )
  : null;

export const extractModule = new Elysia().post(
  "/extract",
  async function extract({ body }) {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not configured");
    }
    const file = await resolveDocumentInput(body.file);
    if (extractQueue && extractQueueEvents) {
      const job = await extractQueue.add(
        "extract",
        {
          file,
          model: body.model,
          schema: body.schema,
        },
        { jobId: crypto.randomUUID() },
      );
      return await job.waitUntilFinished(extractQueueEvents);
    }
    return await extractDocument({
      file,
      model: body.model,
      schema: body.schema,
    });
  },
  {
    body: t.Object({
      file: t.Union([t.File(), t.String()]),
      model: t.UnionEnum(["glm-ocr", "paddleocr"], { default: "paddleocr" }),
      schema: t.Optional(
        t.Any({
          description: "JSON Schema describing the desired output structure",
        }),
      ),
    }),
    detail: {
      description:
        "Upload a file, parse its content using OCR, then extract structured data as JSON using an LLM. Optionally provide a JSON Schema to validate the output structure.",
      summary: "Extract",
    },
  },
);

const _extractQueue = extractQueue;

export const asyncExtractModule = _extractQueue
  ? new Elysia().post(
      "/extract/async",
      async function extractAsync({ body }) {
        if (!env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY environment variable is not configured");
        }
        const file = await resolveDocumentInput(body.file);
        const job = await _extractQueue.add(
          "extract",
          {
            file,
            model: body.model,
            schema: body.schema,
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
          schema: t.Optional(
            t.Any({
              description: "JSON Schema describing the desired output structure",
            }),
          ),
        }),
        detail: {
          summary: "Extract (Async)",
        },
      },
    )
  : null;
