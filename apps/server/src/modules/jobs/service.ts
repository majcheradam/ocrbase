import type { JobStatus, JobType } from "@ocrbase/db/lib/enums";

import { db } from "@ocrbase/db";
import { jobs, type Job } from "@ocrbase/db/schema/jobs";
import { and, asc, count, desc, eq } from "drizzle-orm";

import type { CreateJobBody, ListJobsQuery, PaginationMeta } from "./model";

import { addJob } from "../../services/queue";
import { StorageService } from "../../services/storage";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Convert "undefined" string to null (FormData serialization issue)
const sanitizeOptional = (value: string | undefined | null): string | null =>
  value === undefined || value === "undefined" || value === "" ? null : value;

interface CreateJobInput {
  body: CreateJobBody;
  file: {
    buffer: Buffer;
    name: string;
    size: number;
    type: string;
  };
  organizationId: string;
  userId: string;
}

interface CreateJobFromUrlInput {
  body: CreateJobBody & { url: string };
  organizationId: string;
  userId: string;
}

interface ListJobsResult {
  data: Job[];
  pagination: PaginationMeta;
}

const create = async (input: CreateJobInput): Promise<Job> => {
  const { body, file, organizationId, userId } = input;

  // Generate job ID first so we can use it in the file path
  const { createId } = await import("@ocrbase/db/lib/ids");
  const jobId = createId("job");
  const fileKey = `${organizationId}/jobs/${jobId}/${file.name}`;

  // Upload file to storage first
  await StorageService.uploadFile(fileKey, file.buffer, file.type);

  // Insert job with the correct fileKey
  const [newJob] = await db
    .insert(jobs)
    .values({
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      id: jobId,
      llmModel: sanitizeOptional(body.llmModel),
      llmProvider: sanitizeOptional(body.llmProvider),
      mimeType: file.type,
      organizationId,
      schemaId: sanitizeOptional(body.schemaId),
      status: "pending",
      type: body.type,
      userId,
    })
    .returning();

  if (!newJob) {
    // Clean up uploaded file if job creation fails
    try {
      await StorageService.deleteFile(fileKey);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error("Failed to create job");
  }

  await addJob({
    jobId: newJob.id,
    organizationId,
    userId,
  });

  return newJob;
};

const createFromUrl = async (input: CreateJobFromUrlInput): Promise<Job> => {
  const { body, organizationId, userId } = input;

  const response = await fetch(body.url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
  }

  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());

  const urlParts = new URL(body.url);
  const fileName =
    urlParts.pathname.split("/").pop() ?? `download-${Date.now()}`;

  return create({
    body,
    file: {
      buffer,
      name: fileName,
      size: buffer.length,
      type: contentType,
    },
    organizationId,
    userId,
  });
};

const getById = async (
  organizationId: string,
  _userId: string,
  jobId: string
): Promise<Job | null> => {
  const result = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId)),
  });

  return result ?? null;
};

const deleteJob = async (
  organizationId: string,
  userId: string,
  jobId: string
): Promise<void> => {
  const job = await getById(organizationId, userId, jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.fileKey) {
    try {
      await StorageService.deleteFile(job.fileKey);
    } catch {
      // Ignore storage deletion errors
    }
  }

  await db.delete(jobs).where(eq(jobs.id, jobId));
};

const list = async (
  organizationId: string,
  _userId: string,
  query: ListJobsQuery
): Promise<ListJobsResult> => {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const conditions = [eq(jobs.organizationId, organizationId)];

  if (query.type) {
    conditions.push(eq(jobs.type, query.type as JobType));
  }

  if (query.status) {
    conditions.push(eq(jobs.status, query.status as JobStatus));
  }

  const whereClause = and(...conditions);

  const sortColumn =
    query.sortBy === "updatedAt" ? jobs.updatedAt : jobs.createdAt;
  const orderByClause =
    query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [data, [countResult]] = await Promise.all([
    db.query.jobs.findMany({
      limit,
      offset,
      orderBy: orderByClause,
      where: whereClause,
    }),
    db.select({ count: count() }).from(jobs).where(whereClause),
  ]);

  const totalCount = countResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      limit,
      totalCount,
      totalPages,
    },
  };
};

const getDownloadContent = async (
  organizationId: string,
  userId: string,
  jobId: string,
  format: "json" | "md" = "md"
): Promise<{ content: string; contentType: string; fileName: string }> => {
  const job = await getById(organizationId, userId, jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (format === "json") {
    if (!job.jsonResult) {
      throw new Error("JSON result not available");
    }

    return {
      content: JSON.stringify(job.jsonResult, null, 2),
      contentType: "application/json",
      fileName: `${job.fileName.replace(/\.[^.]+$/, "")}.json`,
    };
  }

  if (!job.markdownResult) {
    throw new Error("Markdown result not available");
  }

  return {
    content: job.markdownResult,
    contentType: "text/markdown",
    fileName: `${job.fileName.replace(/\.[^.]+$/, "")}.md`,
  };
};

const getFileUrl = async (
  organizationId: string,
  userId: string,
  jobId: string
): Promise<string> => {
  const job = await getById(organizationId, userId, jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (!job.fileKey) {
    throw new Error("Job has no associated file");
  }

  return StorageService.getPresignedUrl(job.fileKey);
};

export const JobService = {
  create,
  createFromUrl,
  delete: deleteJob,
  getById,
  getDownloadContent,
  getFileUrl,
  list,
};
