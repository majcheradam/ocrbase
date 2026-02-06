import { describe, expect, test } from "bun:test";

interface JobResponse {
  id: string;
}

interface JobMessage {
  type: "status" | "completed" | "error";
  jobId: string;
  data: {
    status?: string;
    markdownResult?: string;
    error?: string;
  };
}

const BASE_URL = process.env.OCRBASE_URL ?? "http://localhost:3000";
const WS_URL = BASE_URL.replace("http", "ws");
const API_KEY = process.env.OCRBASE_API_KEY;

if (!API_KEY) {
  throw new Error("OCRBASE_API_KEY environment variable is required");
}

const headers = { Authorization: `Bearer ${API_KEY}` };

const waitForJob = (jobId: string, timeoutMs = 30_000): Promise<JobMessage> => {
  const { promise, resolve, reject } = Promise.withResolvers<JobMessage>();

  const ws = new WebSocket(`${WS_URL}/v1/realtime?job_id=${jobId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const timeout = setTimeout(() => {
    ws.close();
    reject(new Error("Job timed out"));
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeout);
    ws.close();
  };

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data as string) as JobMessage;
    if (msg.type === "completed") {
      cleanup();
      resolve(msg);
    } else if (msg.type === "error") {
      cleanup();
      reject(new Error(msg.data.error));
    }
  });

  ws.addEventListener("error", () => {
    cleanup();
    reject(new Error("WebSocket error"));
  });

  return promise;
};

describe("parse", () => {
  test("extracts 'ocrbase' text from image", async () => {
    const file = Bun.file("docs/ocrbase.png");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/v1/parse`, {
      body: formData,
      headers,
      method: "POST",
    });

    expect(res.status).toBe(200);
    const { id } = (await res.json()) as JobResponse;

    const result = await waitForJob(id);
    expect(result.data.markdownResult?.toLowerCase()).toContain("ocrbase");
  });
});
