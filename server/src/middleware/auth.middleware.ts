import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import type { HonoVariables } from "../types/hono";

export const requireAuth = createMiddleware<{
  Variables: HonoVariables;
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
      },
      401,
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});