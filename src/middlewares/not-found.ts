import type { NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { statusCodes } from "better-auth";

const notFound: NotFoundHandler = (c) => {
  return c.json(
    {
      message: `Not Found - ${c.req.path}`,
    },
    statusCodes.NOT_FOUND as ContentfulStatusCode,
  );
};

export default notFound;
