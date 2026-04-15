import { env } from "../../env";
import type { DocumentModel } from ".";

function isPdf(file: string | URL): boolean {
  if (file instanceof URL) {
    return file.pathname.toLowerCase().endsWith(".pdf");
  }

  if (/^https?:\/\//i.test(file)) {
    try {
      return new URL(file).pathname.toLowerCase().endsWith(".pdf");
    } catch {
      return false;
    }
  }

  if (file.startsWith("data:")) {
    return file.startsWith("data:application/pdf");
  }

  try {
    return Buffer.from(file.slice(0, 8), "base64").subarray(0, 4).toString("ascii") === "%PDF";
  } catch {
    return false;
  }
}

function stripDataUrl(file: string | URL): string | URL {
  if (typeof file === "string" && file.startsWith("data:")) {
    const comma = file.indexOf(",");
    if (comma !== -1) {
      return file.slice(comma + 1);
    }
  }
  return file;
}

export const paddleOcr: DocumentModel | null = env.PADDLEOCR_URL
  ? {
      id: "paddleocr",
      async parse(file) {
        const payload = stripDataUrl(file);
        const response = await fetch(`${env.PADDLEOCR_URL}/layout-parsing`, {
          body: JSON.stringify({
            file: payload,
            fileType: isPdf(file) ? 0 : 1,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `PaddleOCR-VL request failed: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        const data = (await response.json()) as {
          result: {
            layoutParsingResults: { markdown: { text: string } }[];
          };
        };

        const markdown_result = data.result.layoutParsingResults
          .map((r) => r.markdown.text)
          .join("\n\n---\n\n");

        return { markdown_result };
      },
    }
  : null;
