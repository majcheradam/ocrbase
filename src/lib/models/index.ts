import { glmOcr } from "./glmocr";
import { paddleOcr } from "./paddleocr";

export type ModelId = "glm-ocr" | "paddleocr";

export interface ParseResult {
  markdown_result: string;
}

export interface DocumentModel {
  id: ModelId;
  parse: (file: URL | string) => Promise<ParseResult>;
}

const models: Record<string, DocumentModel> = Object.fromEntries(
  [glmOcr, paddleOcr].filter((m): m is DocumentModel => m !== null).map((m) => [m.id, m]),
);

export function getModel(id: ModelId): DocumentModel {
  const model = models[id];
  if (!model) {
    throw new Error(`Unknown model: "${id}". Available: ${Object.keys(models).join(", ")}`);
  }
  return model;
}
