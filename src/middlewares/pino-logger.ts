import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import env from "@/env";

export const pinoLogger = () => {
  return logger({
    pino: pino(
      {
        level: env.LOG_LEVEL,
      },
      env.NODE_ENV === "production" ? undefined : pretty(),
    ),
  });
};
