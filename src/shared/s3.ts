import { S3Client } from "@aws-sdk/client-s3";

import env from "@/env";

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT, // e.g., http://127.0.0.1:3902
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  // ⚠️ CRITICAL for Garage/MinIO/Local development
  // This forces URLs like: http://localhost:3902/my-bucket/image.jpg
  // Instead of: http://my-bucket.localhost:3902/image.jpg
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
