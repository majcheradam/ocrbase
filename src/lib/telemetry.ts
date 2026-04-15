import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { env } from "../env";

export const telemetry = opentelemetry({
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        headers: {
          Authorization: `Bearer ${env.OTEL_TOKEN}`,
          "X-Axiom-Dataset": env.OTEL_DATASET,
        },
        url: env.OTEL_ENDPOINT,
      }),
    ),
  ],
});
