import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import env from "@/env";

import { s3Client } from "./s3";

const BUCKET = env.S3_BUCKET_PROPERTY_IMAGES;

export const s3Helpers = {
  // Generate a URL that allows the frontend to upload directly to S3
  createPresignedUploadUrl: async (key: string, contentType: string) => {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });
    // URL expires in 5 minutes
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
  },

  deleteFile: async (key: string) => {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await s3Client.send(command);
  },

  // Convert a DB Key (properties/1/abc.jpg) to a Public URL
  // If your bucket is public, just append the host.
  // If private, you'd generate a Presigned GET URL here.
  getPublicUrl: (key: string) => {
    // Garage S3 usually exposes public buckets at http://localhost:3903/bucket-name/key
    return `${env.S3_PUBLIC_URL}/${BUCKET}/${key}`;
  },

  extractS3Key: (fileUrl: string): string | undefined => {
    try {
      const parsed = new URL(fileUrl);

      return decodeURIComponent(parsed.pathname.slice(1));
    } catch {
      return undefined;
    }
  },
};
