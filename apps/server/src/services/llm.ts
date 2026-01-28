import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@ocrbase/env/server";
import { generateText } from "ai";

const openrouter = createOpenAI({
  apiKey: env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
});

const DEFAULT_MODEL = "google/gemini-2.5-flash-preview";

interface ProcessExtractionOptions {
  markdown: string;
  schema?: Record<string, unknown>;
}

interface GenerateSchemaOptions {
  markdown: string;
  hints?: string;
}

interface GeneratedSchema {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
}

export const checkLlmHealth = async (): Promise<boolean> => {
  if (!env.OPENROUTER_API_KEY) {
    return true;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

const extractJsonFromResponse = <T>(text: string): T => {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1] : text;

  if (!jsonStr) {
    throw new Error("No JSON content found in response");
  }

  const trimmed = jsonStr.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No valid JSON object found in response");
  }

  const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as T;
  return parsed;
};

export const llmService = {
  async generateSchema({
    markdown,
    hints,
  }: GenerateSchemaOptions): Promise<GeneratedSchema> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = `You are a JSON schema generator. Analyze the provided document and generate a JSON schema that can be used to extract structured data from similar documents.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "A descriptive name for this schema",
  "description": "Description of what this schema extracts",
  "jsonSchema": { ... the JSON Schema definition ... }
}

Do not include any markdown formatting or explanation. Just the JSON object.`;

    const userPrompt = hints
      ? `Analyze this document and generate a JSON schema for extracting structured data.

User hints about what to extract: ${hints}

Document content:
${markdown}`
      : `Analyze this document and generate a JSON schema for extracting structured data.

Document content:
${markdown}`;

    const result = await generateText({
      model: openrouter(DEFAULT_MODEL),
      prompt: userPrompt,
      system: systemPrompt,
    });

    return extractJsonFromResponse<GeneratedSchema>(result.text);
  },

  async processExtraction({
    markdown,
    schema,
  }: ProcessExtractionOptions): Promise<Record<string, unknown>> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = `You are a data extraction assistant. Extract structured data from the provided markdown content. Return ONLY valid JSON, no markdown formatting or explanation.`;

    const userPrompt = schema
      ? `Extract data from the following markdown content according to this JSON schema:

Schema:
${JSON.stringify(schema, null, 2)}

Markdown Content:
${markdown}`
      : `Extract all relevant structured data from the following markdown content and return it as JSON:

${markdown}`;

    const result = await generateText({
      model: openrouter(DEFAULT_MODEL),
      prompt: userPrompt,
      system: systemPrompt,
    });

    return extractJsonFromResponse<Record<string, unknown>>(result.text);
  },
};
