import type { ZodObject, ZodRawShape } from "zod";

import { z } from "zod";
import { ZodError } from "zod";

const DEFAULT_MIN_STRING_LENGTH = 1;
const DEFAULT_SECRET_LENGTH = 32;

const raw = process.env;

const schema = z.object({
  PORT: z.coerce.number(),
  BETTER_AUTH_SECRET: z.string().min(DEFAULT_SECRET_LENGTH),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().min(DEFAULT_MIN_STRING_LENGTH),
  GITHUB_CLIENT_SECRET: z.string().min(DEFAULT_MIN_STRING_LENGTH),
  GOOGLE_CLIENT_ID: z.string().min(DEFAULT_MIN_STRING_LENGTH),
  GOOGLE_CLIENT_SECRET: z.string().min(DEFAULT_MIN_STRING_LENGTH),
  MAIL_HOST: z.string(),
  MAIL_PASSWORD: z.string().nullable(),
  MAIL_PORT: z.coerce.number(),
  MAIL_USERNAME: z.string().nullable(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  S3_ACCESS_KEY: z.string(),
  S3_BUCKET_DOCUMENTS: z.string(),
  S3_BUCKET_PROPERTY_IMAGES: z.string(),
  S3_BUCKET_USER_AVATARS: z.string(),
  S3_ENDPOINT: z.url(),
  S3_PUBLIC_URL: z.url(),
  S3_REGION: z.string(),
  S3_SECRET_KEY: z.string(),
});

const checkEnv = <TObject extends ZodRawShape>(
  EnvSchema: ZodObject<TObject>,
  env: NodeJS.ProcessEnv,
) => {
  try {
    EnvSchema.parse(env);
  } catch (error) {
    if (error instanceof ZodError) {
      let message = "Missing required values in .env:\n";
      for (const issue of error.issues) {
        message += `${String(issue.path[0])}\n`;
      }
      const formattedError = new Error(message);
      formattedError.stack = "";
      throw formattedError;
    } else {
      // oxlint-disable-next-line no-console
      console.error(error);
    }
  }
};

checkEnv(schema, raw);

const env = schema.parse(raw);

export type Environment = z.infer<typeof schema>;

export default env;
