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

```typescript
import { createClient } from "ocrbase";

const { parse, extract } = createClient({
  baseUrl: "https://api.ocrbase.dev",
  apiKey: "ak_xxx",
});

// Parse document to markdown
const job = await parse({ file: document });
console.log(job.markdownResult);

// Extract structured data
const job = await extract({
  file: invoice,
  hints: "invoice number, date, total, line items",
});
console.log(job.jsonResult);
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
