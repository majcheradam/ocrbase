import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type {
  CreateJobInput,
  JobResponse,
  ListJobsQuery,
  ListJobsResponse,
} from "../../types";

import { useOCRBaseClient } from "../provider";

export const jobKeys = {
  all: ["jobs"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  fileUrl: (id: string) => [...jobKeys.all, "fileUrl", id] as const,
  list: (query?: ListJobsQuery) => [...jobKeys.lists(), query] as const,
  lists: () => [...jobKeys.all, "list"] as const,
};

export const useJobs = (
  query?: ListJobsQuery
): UseQueryResult<ListJobsResponse> => {
  const client = useOCRBaseClient();

  return useQuery({
    queryFn: () => client.jobs.list(query),
    queryKey: jobKeys.list(query),
  });
};

export const useJob = (id: string): UseQueryResult<JobResponse> => {
  const client = useOCRBaseClient();

  return useQuery({
    enabled: Boolean(id),
    queryFn: () => client.jobs.get(id),
    queryKey: jobKeys.detail(id),
  });
};

export const useCreateJob = (): UseMutationResult<
  JobResponse,
  Error,
  CreateJobInput
> => {
  const client = useOCRBaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => client.jobs.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
};

export const useDeleteJob = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const client = useOCRBaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => client.jobs.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
    },
  });
};

export const useDownloadJob = (): UseMutationResult<
  string,
  Error,
  { id: string; format?: "md" | "json" }
> => {
  const client = useOCRBaseClient();

  return useMutation({
    mutationFn: ({ format, id }) => client.jobs.download(id, format),
  });
};

// Presigned URLs are valid for 1 hour, so cache for 30 minutes
const PRESIGNED_URL_STALE_TIME = 1000 * 60 * 30;

export const useJobFileUrl = (
  id: string | undefined
): UseQueryResult<string> => {
  const client = useOCRBaseClient();

  return useQuery({
    enabled: Boolean(id),
    queryFn: () => client.jobs.getFileUrl(id ?? ""),
    queryKey: jobKeys.fileUrl(id ?? ""),
    staleTime: PRESIGNED_URL_STALE_TIME,
  });
};
