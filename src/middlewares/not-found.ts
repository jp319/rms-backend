import type { NotFoundHandler } from "hono";

import { StatusCodes } from "http-status-toolkit";

const notFound: NotFoundHandler = (c) => {
  return c.json(
    {
      message: `Not Found - ${c.req.path}`,
    },
    StatusCodes.NOT_FOUND,
  );
};

export default notFound;
