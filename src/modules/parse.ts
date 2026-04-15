import { Elysia, t } from "elysia";

import { getModel } from "../lib/models";
import type { ParseResult, ModelId } from "../lib/models";

export interface ParseDocumentInput {
  model: ModelId;
  file: File | URL | string;
}

async function toDataUrl(file: File): Promise<string> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function parseDocument({ model, file }: ParseDocumentInput): Promise<ParseResult> {
  const documentModel = getModel(model);
  const resolved = file instanceof File ? await toDataUrl(file) : file;

  return await documentModel.parse(resolved);
}

export const parseModule = new Elysia().post(
  "/parse",
  async function parse({ body }) {
    return await parseDocument({
      file: body.file,
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
