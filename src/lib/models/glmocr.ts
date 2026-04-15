import { env } from "../../env";
import type { DocumentModel } from ".";

export const glmOcr: DocumentModel | null = env.GLM_OCR_URL
  ? {
      id: "glm-ocr",
      async parse(file) {
        const response = await fetch(`${env.GLM_OCR_URL}/glmocr/parse`, {
          body: JSON.stringify({ file }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`GLM OCR request failed: ${response.status}`);
        }

        return (await response.json()) as { markdown_result: string };
      },
    }
  : null;
