import type { EdenClient } from "../client";
import type { JobResponse, ListJobsQuery, ListJobsResponse } from "../types";

import { SDKError } from "../errors";

export interface JobsClient {
  /** List jobs with optional filtering and pagination */
  list: (query?: ListJobsQuery) => Promise<ListJobsResponse>;
  /** Get a single job by ID */
  get: (id: string) => Promise<JobResponse>;
  /** Delete a job by ID */
  delete: (id: string) => Promise<{ message: string }>;
  /** Download job result as markdown or JSON */
  download: (id: string, format?: "md" | "json") => Promise<string>;
}

export const createJobsClient = (eden: EdenClient): JobsClient => ({
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
