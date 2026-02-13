import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, bearer, openAPI } from "better-auth/plugins";

import type { Environment } from "@/env";

import envRaw from "@/env";
import { sendEmail } from "@/modules/mail/mail.service";
import ownersRepository from "@/modules/owners/owners.repository";
import createDb from "@/shared/db";
import * as schema from "@/shared/db/schemas";

const createAuth = (env: Environment | undefined = envRaw) => {
  const db = createDb(env);
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.role === "owner") {
              await ownersRepository.create(user);
            }
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignIn: true,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        void sendEmail({
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
          to: user.email,
        });
      },
    },
    plugins: [
      bearer(),
      openAPI(),
      apiKey({
        enableSessionForAPIKeys: true,
      }),
    ],
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    user: {
      additionalFields: {
        role: {
          input: true,
          required: true,
          type: ["owner", "tenant"],
        },
      },
    },
  });
};

export default createAuth;
