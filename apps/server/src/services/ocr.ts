import { env } from "@ocrbase/env/server";
import PaddleocrVlClient from "paddleocr-vl";

export interface ParseResult {
  markdown: string;
  pageCount: number;
}

const ocrClient = new PaddleocrVlClient({
  apiKey: env.PADDLEOCR_VL_API_KEY,
  baseURL: env.PADDLE_OCR_URL,
  maxRetries: 0,
  timeout: env.PADDLE_OCR_TIMEOUT_MS,
});

const getFileType = (mimeType: string): 0 | 1 => {
  if (mimeType === "application/pdf") {
    return 0 as const;
  }
  return 1 as const;
};

export const parseDocument = async (
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult> => {
  const base64 = buffer.toString("base64");
  const fileType = getFileType(mimeType);

  const response = await ocrClient.layoutParsing.infer({
    file: base64,
    fileType,
    // Preserve previous in-house defaults (excluding maxNewTokens, which should
    // remain server-side configurable).
    prettifyMarkdown: true,
    useLayoutDetection: true,
  });

  const markdown = response.result.layoutParsingResults
    .map((r) => r.markdown.text)
    .join("\n\n---\n\n");
  const pageCount =
    typeof response.result.dataInfo === "object" &&
    response.result.dataInfo !== null &&
    "numPages" in response.result.dataInfo &&
    typeof (response.result.dataInfo as { numPages: unknown }).numPages ===
      "number"
      ? (response.result.dataInfo as { numPages: number }).numPages
      : 1;

  return { markdown, pageCount };
};

export const checkOcrHealth = async (): Promise<boolean> => {
  try {
    const response = await ocrClient.health.check();
    return response.errorCode === 0;
  } catch {
    return false;
  }
};

export { ocrClient };
