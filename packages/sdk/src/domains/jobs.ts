import type { EdenClient } from "../client";
import type {
  CreateJobInput,
  JobResponse,
  ListJobsQuery,
  ListJobsResponse,
} from "../types";

import { SDKError } from "../errors";

export interface JobsClient {
  /** List jobs with optional filtering and pagination */
  list: (query?: ListJobsQuery) => Promise<ListJobsResponse>;
  /** Get a single job by ID */
  get: (id: string) => Promise<JobResponse>;
  /** Create a new job from file or URL */
  create: (input: CreateJobInput) => Promise<JobResponse>;
  /** Delete a job by ID */
  delete: (id: string) => Promise<{ message: string }>;
  /** Download job result as markdown or JSON */
  download: (id: string, format?: "md" | "json") => Promise<string>;
  /** Get presigned URL for viewing the uploaded file */
  getFileUrl: (id: string) => Promise<string>;
}

export const createJobsClient = (eden: EdenClient): JobsClient => ({
  create: async (input) => {
    // Build body with only defined values to avoid "undefined" strings in FormData
    const body = {
      type: input.type,
      ...(input.file !== undefined && { file: input.file }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.llmModel !== undefined && { llmModel: input.llmModel }),
      ...(input.llmProvider !== undefined && {
        llmProvider: input.llmProvider,
      }),
      ...(input.schemaId !== undefined && { schemaId: input.schemaId }),
    };

    const { data, error } = await eden.api.jobs.post(body);

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as JobResponse;
  },

  delete: async (id) => {
    const { data, error } = await eden.api.jobs({ id }).delete();

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as { message: string };
  },

  download: async (id, format = "md") => {
    const { data, error } = await eden.api.jobs({ id }).download.get({
      query: { format },
    });

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as string;
  },

  get: async (id) => {
    const { data, error } = await eden.api.jobs({ id }).get();

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as JobResponse;
  },

  getFileUrl: async (id) => {
    const { data, error } = await eden.api.jobs({ id }).file.get();

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return (data as { url: string }).url;
  },

  list: async (query = {}) => {
    const { data, error } = await eden.api.jobs.get({
      query: {
        limit: query.limit,
        page: query.page,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.status,
        type: query.type,
      },
    });

    if (error) {
      throw SDKError.fromEdenError(error);
    }

    return data as ListJobsResponse;
  },
});
