/**
 * Headers can be a static object or a function that returns headers dynamically.
 * Function receives the request path and options for conditional header logic.
 */
export type SDKHeaders =
  | HeadersInit
  | ((path: string, options: RequestInit) => HeadersInit | void)
  | Array<(path: string, options: RequestInit) => HeadersInit | void>;

/**
 * Hook called before each request. Return an object to merge with RequestInit.
 */
export type OnRequestHook = (
  path: string,
  options: RequestInit
) => RequestInit | void | Promise<RequestInit | void>;

/**
 * Hook called after each response. Can modify or replace the response.
 */
export type OnResponseHook = (
  response: Response
) => Response | void | Promise<Response | void>;

/**
 * Configuration for the ocrbase SDK client.
 */
export interface SDKConfig {
  /** Base URL of the ocrbase API server (default: https://api.ocrbase.dev) */
  baseUrl?: string;

  /** API key for authentication (recommended) */
  apiKey?: string;

  /** Default headers for all requests */
  headers?: SDKHeaders;

  /** Credentials mode for fetch requests */
  credentials?: "include" | "omit" | "same-origin";

  /** Hook(s) called before each request */
  onRequest?: OnRequestHook | OnRequestHook[];

  /** Hook(s) called after each response */
  onResponse?: OnResponseHook | OnResponseHook[];
}

export type JobType = "parse" | "extract";

export type JobStatus =
  | "pending"
  | "processing"
  | "extracting"
  | "completed"
  | "failed";

export interface JobResponse {
  id: string;
  organizationId: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  fileName: string;
  fileKey: string | null;
  fileSize: number;
  mimeType: string;
  sourceUrl: string | null;
  schemaId: string | null;
  hints: string | null;
  markdownResult: string | null;
  jsonResult: unknown | null;
  pageCount: number | null;
  tokenCount: number | null;
  processingTimeMs: number | null;
  retryCount: number;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListJobsResponse {
  data: JobResponse[];
  pagination: PaginationMeta;
}

export interface ListJobsQuery {
  page?: number;
  limit?: number;
  status?: JobStatus;
  type?: JobType;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ParseInput {
  file?: File;
  url?: string;
}

export interface ExtractInput {
  file?: File;
  url?: string;
  schemaId?: string;
  hints?: string;
}

export interface SchemaResponse {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  description: string | null;
  jsonSchema: Record<string, unknown>;
  sampleJobId: string | null;
  generatedBy: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchemaInput {
  name: string;
  description?: string;
  jsonSchema: Record<string, unknown>;
}

export interface UpdateSchemaInput {
  name?: string;
  description?: string | null;
  jsonSchema?: Record<string, unknown>;
}

export interface GenerateSchemaInput {
  jobId?: string;
  hints?: string;
  name?: string;
}

export interface GenerateSchemaResponse {
  suggestedName: string;
  suggestedDescription: string;
  suggestedSchema: Record<string, unknown>;
  sampleJobId?: string;
  sampleMarkdown?: string;
}

export interface HealthCheck {
  database: boolean;
  redis: boolean;
  storage: boolean;
  ocr: boolean;
  llm: boolean;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck;
  timestamp: string;
}

export interface LiveResponse {
  status: "ok";
}

export interface JobUpdateMessage {
  type: "status" | "completed" | "error";
  jobId: string;
  data: {
    status?: JobStatus;
    processingTimeMs?: number;
    error?: string;
    markdownResult?: string;
    jsonResult?: unknown;
  };
}

export interface WebSocketCallbacks {
  onStatus?: (status: JobStatus) => void;
  onComplete?: (data: {
    markdownResult?: string;
    jsonResult?: unknown;
    processingTimeMs?: number;
  }) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}
