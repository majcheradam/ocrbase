import { Elysia, t } from "elysia";

import { resolveDocumentInput } from "../lib/file";
import { getModel } from "../lib/models";
import type { ParseResult, ModelId } from "../lib/models";

export interface ParseDocumentInput {
  model: ModelId;
  file: File | URL | string;
}

export async function parseDocument({ model, file }: ParseDocumentInput): Promise<ParseResult> {
  const documentModel = getModel(model);
  const resolved = await resolveDocumentInput(file);

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
