# ocrbase

Turn PDFs into structured data at scale. Powered by frontier open-weight OCR models.

## Features

- **Best-in-class OCR** - [PaddleOCR-VL-1.5 0.9B](http://www.paddleocr.ai/main/en/version3.x/pipeline_usage/PaddleOCR-VL.html) for accurate text extraction
- **Structured extraction** - Define schemas, get JSON back
- **Built for scale** - Queue-based scaling using [BullMQ](https://github.com/taskforcesh/bullmq)
- **Real-time updates** - [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) notifications for job progress
- **Self-hostable** - Run on your own infrastructure using [Self-Hosting Guide](./docs/SELF_HOSTING.md)

## SDK

**NOTE:** TS SDK is currently moving to [ocrbase-typescript](https://github.com/ocrbase-hq/ocrbase-typescript)

## API Docs

- OpenAPI UI: `https://api.ocrbase.dev/openapi`
- OpenAPI JSON: `https://api.ocrbase.dev/openapi/json`

## API Usage

```bash
# Parse a document
curl -X POST https://api.ocrbase.dev/v1/parse \
  -H "Authorization: Bearer sk_xxx" \
  -F "file=@document.pdf"

# Extract with schema
curl -X POST https://api.ocrbase.dev/v1/extract \
  -H "Authorization: Bearer sk_xxx" \
  -F "file=@invoice.pdf" \
  -F "schemaId=inv_schema_123"
```

**NOTE:** Jobs are processed asynchronously.

## Realtime Updates

```bash
# Subscribe to job status updates
wscat -c "wss://api.ocrbase.dev/v1/realtime?job_id=job_xxx" \
  -H "Authorization: Bearer sk_xxx"
```

## Health Checks

- `GET /v1/health/live`
- `GET /v1/health/ready`

## LLM Integration

**Best practice:** Parse documents with ocrbase before sending to LLMs. Raw PDF binary wastes tokens and produces poor results.

## Self-Hosting

See [Self-Hosting Guide](./docs/SELF_HOSTING.md) for deployment instructions.

**Requirements:** Docker, Bun

## Architecture

![Architecture Diagram](docs/architecture.svg)

## License

MIT - See [LICENSE](LICENSE) for details.

## Contact

For API access, on-premise deployment, or questions: adammajcher20@gmail.com
