// Client
export {
  createOCRBaseClient,
  type EdenClient,
  type OCRBaseClient,
} from "./client";

// Errors
export {
  SDKError,
  type EdenErrorResponse,
  type SDKErrorCode,
  type SDKErrorDetails,
} from "./errors";

// Types
export type {
  CreateSchemaInput,
  ExtractInput,
  GenerateSchemaInput,
  GenerateSchemaResponse,
  HealthCheck,
  HealthResponse,
  JobResponse,
  JobStatus,
  JobType,
  JobUpdateMessage,
  ListJobsQuery,
  ListJobsResponse,
  LiveResponse,
  OnRequestHook,
  OnResponseHook,
  PaginationMeta,
  ParseInput,
  SchemaResponse,
  SDKConfig,
  SDKHeaders,
  UpdateSchemaInput,
  WebSocketCallbacks,
} from "./types";

// Domain clients
export type { HealthClient } from "./domains/health";
export type { JobsClient } from "./domains/jobs";
export type { SchemasClient } from "./domains/schemas";
export type { WebSocketClient } from "./domains/websocket";
