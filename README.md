# ocrbase

Turn PDFs into structured data at scale. Powered by frontier open-weight OCR models with a type-safe TypeScript SDK.

## Features

- **Best-in-class OCR** - PaddleOCR-VL-0.9B for accurate text extraction
- **Structured extraction** - Define schemas, get JSON back
- **Built for scale** - Queue-based processing for thousands of documents
- **Type-safe SDK** - Full TypeScript support with React hooks
- **Real-time updates** - WebSocket notifications for job progress
- **Self-hostable** - Run on your own infrastructure

## Quick Start

```bash
npm install ocrbase
```

```env
# .env
OCRBASE_API_KEY=sk_xxx
```

```typescript
import { createClient } from "ocrbase";

const { parse, extract } = createClient({
  apiKey: process.env.OCRBASE_API_KEY,
});

// Parse document to markdown
const job = await parse({ file: document });
console.log(job.markdownResult);

// Extract structured data
const extracted = await extract({
  file: invoice,
  hints: "invoice number, date, total, line items",
});
console.log(extracted.jsonResult);
```

## LLM Integration

**Best practice:** Always parse documents with ocrbase before sending to LLMs. Raw PDF binary data wastes tokens and produces poor results. ocrbase extracts clean markdown that LLMs understand.

### With OpenAI

```typescript
import { createClient } from "ocrbase";
import OpenAI from "openai";

const ocrbase = createClient({ apiKey: process.env.OCRBASE_API_KEY });
const openai = new OpenAI();

// Parse PDF to markdown first
const { markdownResult } = await ocrbase.parse({ file: pdfFile });

// Send clean text to LLM
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You analyze documents." },
    { role: "user", content: `Summarize this document:\n\n${markdownResult}` },
  ],
});
```

### With Vercel AI SDK

```typescript
import { createClient } from "ocrbase";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const ocrbase = createClient({ apiKey: process.env.OCRBASE_API_KEY });

const { markdownResult } = await ocrbase.parse({ file: pdfFile });

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: `Extract key points from this document:\n\n${markdownResult}`,
});
```

### With OpenRouter

```typescript
import { createClient } from "ocrbase";
import OpenAI from "openai";

const ocrbase = createClient({ apiKey: process.env.OCRBASE_API_KEY });
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const { markdownResult } = await ocrbase.parse({ file: pdfFile });

const response = await openrouter.chat.completions.create({
  model: "anthropic/claude-sonnet-4",
  messages: [{ role: "user", content: `Analyze:\n\n${markdownResult}` }],
});
```

See [SDK documentation](./packages/sdk/README.md) for React hooks and advanced usage.

## Self-Hosting

See [Self-Hosting Guide](./docs/SELF_HOSTING.md) for deployment instructions.

**Requirements:** Docker, Bun

## Architecture

![Architecture Diagram](docs/architecture.svg)

## License

MIT - See [LICENSE](LICENSE) for details.

## Contact

For API access, on-premise deployment, or questions: adammajcher20@gmail.com
