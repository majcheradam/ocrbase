# ocrbase

Turn PDFs into structured data at scale. Powered by frontier open-weight OCR models with a type-safe TypeScript SDK.

## Features

- **Best-in-class OCR** - PaddleOCR-VL-0.9B for accurate text extraction
- **Structured extraction** - Define schemas, get JSON back
- **Built for scale** - Queue-based processing for thousands of documents
- **Type-safe SDK** - Full TypeScript support with React hooks
- **Real-time updates** - WebSocket notifications for job progress (client-side)
- **Self-hostable** - Run on your own infrastructure

## Quick Start

```bash
npm install ocrbase
```

```env
# .env
OCRBASE_API_KEY=sk_xxx
```

**Important:** Jobs are processed asynchronously. Use WebSocket for real-time status updates.

```typescript
import { createClient } from "ocrbase";

const { parse, extract, ws } = createClient({
  apiKey: process.env.OCRBASE_API_KEY,
});

// Start parsing (returns job with status "pending")
const job = await parse({ file: document });

// Subscribe to real-time updates via WebSocket
ws.subscribeToJob(job.id, {
  onComplete: (result) => {
    console.log(result.markdownResult); // string - the parsed markdown
  },
});
```

### React Integration

Use the `useJobSubscription` hook for real-time updates:

```tsx
import { useParse, useJobSubscription } from "ocrbase/react";

function DocumentParser() {
  const [jobId, setJobId] = useState<string | null>(null);
  const parse = useParse();

  const handleFile = (file: File) => {
    parse.mutate({ file }, { onSuccess: (job) => setJobId(job.id) });
  };

  const { status, job } = useJobSubscription(jobId!, { enabled: !!jobId });

  if (status === "completed" && job) {
    return <pre>{job.markdownResult}</pre>;
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleFile(e.target.files![0])} />
      {status && <p>Status: {status}</p>}
    </div>
  );
}
```

## LLM Integration

**Best practice:** Parse documents with ocrbase before sending to LLMs. Raw PDF binary wastes tokens and produces poor results.

**Pattern:** Parse on client with WebSocket → send markdown to your API → call LLM.

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
