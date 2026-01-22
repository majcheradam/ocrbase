export {
  OCRBaseProvider,
  useOCRBaseClient,
  useOCRBaseConfig,
  type OCRBaseProviderProps,
} from "./provider";

export {
  jobKeys,
  useCreateJob,
  useDeleteJob,
  useDownloadJob,
  useJob,
  useJobFileUrl,
  useJobs,
} from "./hooks/use-jobs";

export {
  schemaKeys,
  useCreateSchema,
  useDeleteSchema,
  useGenerateSchema,
  useSchema,
  useSchemas,
  useUpdateSchema,
} from "./hooks/use-schemas";

export {
  useJobSubscription,
  type UseJobSubscriptionOptions,
  type UseJobSubscriptionResult,
} from "./hooks/use-job-subscription";
