import { S3Client } from "bun";

import { env } from "../env";

export const isS3Configured = Boolean(
  env.S3_ACCESS_KEY_ID && env.S3_BUCKET && env.S3_ENDPOINT && env.S3_SECRET_ACCESS_KEY,
);

export const s3 = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  bucket: env.S3_BUCKET,
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
});
