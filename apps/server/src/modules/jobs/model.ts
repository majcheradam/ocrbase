import { Type, type Static } from "@sinclair/typebox";

const JOB_ID_PATTERN = "^job_[a-zA-Z0-9_-]+$";
const JOB_TYPES = ["parse", "extract"] as const;
const JOB_STATUSES = [
  "pending",
  "processing",
  "extracting",
  "completed",
  "failed",
] as const;

const JobId = Type.String({ pattern: JOB_ID_PATTERN });

const CreateJobBody = Type.Object({
  schemaId: Type.Optional(Type.String()),
  type: Type.Union([Type.Literal("parse"), Type.Literal("extract")]),
});

const CreateJobFromUrl = Type.Object({
  schemaId: Type.Optional(Type.String()),
  type: Type.Union([Type.Literal("parse"), Type.Literal("extract")]),
  url: Type.String({ format: "uri" }),
});

const ListJobsQuery = Type.Object({
  limit: Type.Optional(Type.Number({ default: 20, maximum: 100, minimum: 1 })),
  page: Type.Optional(Type.Number({ default: 1, minimum: 1 })),
  sortBy: Type.Optional(
    Type.Union([Type.Literal("createdAt"), Type.Literal("updatedAt")])
  ),
  sortOrder: Type.Optional(
    Type.Union([Type.Literal("asc"), Type.Literal("desc")])
  ),
  status: Type.Optional(
    Type.Union([
      Type.Literal("pending"),
      Type.Literal("processing"),
      Type.Literal("extracting"),
      Type.Literal("completed"),
      Type.Literal("failed"),
    ])
  ),
  type: Type.Optional(
    Type.Union([Type.Literal("parse"), Type.Literal("extract")])
  ),
});

const JobResponse = Type.Object({
  completedAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  errorCode: Type.Union([Type.String(), Type.Null()]),
  errorMessage: Type.Union([Type.String(), Type.Null()]),
  fileKey: Type.String(),
  fileName: Type.String(),
  fileSize: Type.Number(),
  id: Type.String({ pattern: JOB_ID_PATTERN }),
  jsonResult: Type.Optional(Type.Unknown()),
  markdownResult: Type.Union([Type.String(), Type.Null()]),
  mimeType: Type.String(),
  organizationId: Type.String(),
  pageCount: Type.Union([Type.Number(), Type.Null()]),
  processingTimeMs: Type.Union([Type.Number(), Type.Null()]),
  retryCount: Type.Number(),
  schemaId: Type.Union([Type.String(), Type.Null()]),
  sourceUrl: Type.Union([Type.String(), Type.Null()]),
  startedAt: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("processing"),
    Type.Literal("extracting"),
    Type.Literal("completed"),
    Type.Literal("failed"),
  ]),
  tokenCount: Type.Union([Type.Number(), Type.Null()]),
  type: Type.Union([Type.Literal("parse"), Type.Literal("extract")]),
  updatedAt: Type.String(),
  userId: Type.String(),
});

const PaginationMeta = Type.Object({
  currentPage: Type.Number(),
  hasNextPage: Type.Boolean(),
  hasPreviousPage: Type.Boolean(),
  limit: Type.Number(),
  totalCount: Type.Number(),
  totalPages: Type.Number(),
});

const ListJobsResponse = Type.Object({
  data: Type.Array(JobResponse),
  pagination: PaginationMeta,
});

const DownloadQuery = Type.Object({
  format: Type.Optional(Type.Union([Type.Literal("md"), Type.Literal("json")])),
});

export const JobModel = {
  CreateJobBody,
  CreateJobFromUrl,
  DownloadQuery,
  JobId,
  JobResponse,
  ListJobsQuery,
  ListJobsResponse,
  PaginationMeta,
} as const;

export type CreateJobBody = Static<typeof CreateJobBody>;
export type CreateJobFromUrl = Static<typeof CreateJobFromUrl>;
export type DownloadQuery = Static<typeof DownloadQuery>;
export type JobResponse = Static<typeof JobResponse>;
export type ListJobsQuery = Static<typeof ListJobsQuery>;
export type ListJobsResponse = Static<typeof ListJobsResponse>;
export type PaginationMeta = Static<typeof PaginationMeta>;

export { JOB_STATUSES, JOB_TYPES };
