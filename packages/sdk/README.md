# ocrbase

Type-safe SDK for ocrbase - document parsing and data extraction API.

## Installation

```bash
npm install ocrbase
```

## Quick Start

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

## Core API

### Parse - Document to Markdown

```typescript
const { parse } = createClient({ baseUrl, apiKey });

// From file
const job = await parse({ file: myFile });

// From URL
const job = await parse({ url: "https://example.com/document.pdf" });

// Result
job.id; // "job_abc123"
job.status; // "completed"
job.markdownResult; // "# Document Title\n\nContent..."
```

### Extract - Document to Structured Data

```typescript
const { extract } = createClient({ baseUrl, apiKey });

// With hints (schema-free extraction)
const job = await extract({
  file: invoice,
  hints: "invoice number, vendor name, total amount, line items",
});

// With predefined schema
const job = await extract({
  file: invoice,
  schemaId: "sch_invoices",
});

// Result
job.jsonResult; // { invoiceNumber: "INV-001", total: 1234.56, ... }
```

### Jobs - Manage Processing Jobs

```typescript
const { jobs } = createClient({ baseUrl, apiKey });

// List jobs
const { data, pagination } = await jobs.list({
  status: "completed",
  type: "extract",
  limit: 20,
});

// Get single job
const job = await jobs.get("job_abc123");

// Download result
const markdown = await jobs.download("job_abc123", "md");
const json = await jobs.download("job_abc123", "json");

// Delete job
await jobs.delete("job_abc123");
```

### Schemas - Manage Extraction Schemas

```typescript
const { schemas } = createClient({ baseUrl, apiKey });

// List schemas
const list = await schemas.list();

// Create schema
const schema = await schemas.create({
  name: "Invoice",
  description: "Extract invoice data",
  jsonSchema: {
    type: "object",
    properties: {
      invoiceNumber: { type: "string" },
      total: { type: "number" },
    },
  },
});

// Generate schema from sample document
const generated = await schemas.generate({
  jobId: "job_abc123",
  hints: "focus on line items and totals",
});
```

### WebSocket - Real-time Job Updates

```typescript
const { ws } = createClient({ baseUrl, apiKey });

const unsubscribe = ws.subscribeToJob("job_abc123", {
  onStatus: (status) => console.log("Status:", status),
  onComplete: (job) => console.log("Done:", job.jsonResult),
  onError: (error) => console.error("Failed:", error),
});

// Later: cleanup
unsubscribe();
```

---

## React Integration

```bash
npm install ocrbase @tanstack/react-query
```

### Setup

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OCRBaseProvider } from "ocrbase/react";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OCRBaseProvider
        config={{
          baseUrl: "https://api.ocrbase.dev",
          apiKey: "ak_xxx",
        }}
      >
        <YourApp />
      </OCRBaseProvider>
    </QueryClientProvider>
  );
}
```

### Document Drop Zone

Complete example with drag & drop, real-time progress, and results:

```tsx
import { useParse, useJobSubscription } from "ocrbase/react";
import { useCallback, useState } from "react";

function DocumentDropZone() {
  const [jobId, setJobId] = useState<string | null>(null);
  const parse = useParse();

  const onDrop = useCallback(
    (files: FileList) => {
      const file = files[0];
      parse.mutate(
        { file },
        {
          onSuccess: (job) => setJobId(job.id),
        }
      );
    },
    [parse]
  );

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {parse.isPending && <p>Uploading...</p>}
      {jobId && <JobProgress jobId={jobId} />}
      {!jobId && !parse.isPending && <p>Drop a document here</p>}
    </div>
  );
}

function JobProgress({ jobId }: { jobId: string }) {
  const { status, job, isConnected } = useJobSubscription(jobId, {
    onComplete: (job) => {
      console.log("Extraction complete:", job.jsonResult);
    },
  });

  if (status === "completed" && job) {
    return <pre>{job.markdownResult}</pre>;
  }

  return (
    <p>
      {isConnected ? "Connected" : "Connecting..."} - {status}
    </p>
  );
}
```

### Extract with Hints

```tsx
import { useExtract, useJobSubscription } from "ocrbase/react";

function InvoiceExtractor() {
  const [jobId, setJobId] = useState<string | null>(null);
  const extract = useExtract();

  const handleFile = (file: File) => {
    extract.mutate(
      {
        file,
        hints:
          "invoice number, date, vendor, total, line items with description and amount",
      },
      {
        onSuccess: (job) => setJobId(job.id),
      }
    );
  };

  const { job, status } = useJobSubscription(jobId!, {
    enabled: !!jobId,
  });

  if (status === "completed" && job?.jsonResult) {
    return <InvoiceDisplay data={job.jsonResult} />;
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleFile(e.target.files![0])} />
      {extract.isPending && <p>Uploading...</p>}
      {status === "processing" && <p>Parsing document...</p>}
      {status === "extracting" && <p>Extracting data...</p>}
    </div>
  );
}
```

### React Hooks Reference

| Hook                     | Description                              |
| ------------------------ | ---------------------------------------- |
| `useParse()`             | Parse document mutation                  |
| `useExtract()`           | Extract data mutation                    |
| `useJobs(query?)`        | List jobs query                          |
| `useJob(id)`             | Get single job query                     |
| `useDeleteJob()`         | Delete job mutation                      |
| `useSchemas()`           | List schemas query                       |
| `useSchema(id)`          | Get single schema query                  |
| `useCreateSchema()`      | Create schema mutation                   |
| `useGenerateSchema()`    | Generate schema mutation                 |
| `useJobSubscription(id)` | WebSocket subscription with auto-refresh |

---

## Error Handling

```typescript
import { SDKError } from "ocrbase";

try {
  await parse({ file });
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        // Redirect to login
        break;
      case "VALIDATION_ERROR":
        // Show form errors
        break;
      case "SERVER_ERROR":
        // Retry or show error
        break;
    }
  }
}
```

| Code               | Status | Description                |
| ------------------ | ------ | -------------------------- |
| `UNAUTHORIZED`     | 401    | Invalid or missing API key |
| `NOT_FOUND`        | 404    | Resource not found         |
| `VALIDATION_ERROR` | 400    | Invalid request            |
| `SERVER_ERROR`     | 5xx    | Server error               |
| `NETWORK_ERROR`    | -      | Connection failed          |

---

## Configuration

```typescript
const client = createClient({
  // Required
  baseUrl: "https://api.ocrbase.dev",

  // API key authentication
  apiKey: "ak_xxx",

  // Or custom headers
  headers: {
    Authorization: "Bearer xxx",
  },

  // Request/response interceptors
  onRequest: (path, options) => {
    console.log("Request:", path);
    return options;
  },
  onResponse: (response) => {
    console.log("Response:", response.status);
    return response;
  },
});
```

---

## TypeScript

Full type inference from the API:

```typescript
import type { JobResponse, SchemaResponse } from "ocrbase";

// Types are inferred from API responses
const job = await parse({ file }); // job: JobResponse
const schema = await schemas.get("sch_xxx"); // schema: SchemaResponse
```

## License

MIT
