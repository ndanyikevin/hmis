import { createMiddleware } from "hono/factory";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { memberships } from "../db/schema";
import type { HonoVariables } from "../types/hono";

export const requireMembership = createMiddleware<{
  Variables: HonoVariables;
}>(async (c, next) => {
  const user = c.get("user");

  const organizationId = c.req.header("X-Organization-Id");

  if (!organizationId) {
    return c.json(
      {
        success: false,
        message: "Organization ID is required",
      },
      400,
    );
  }

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, user.id),
      eq(memberships.organizationId, organizationId),
      eq(memberships.status, "active"),
    ),
  });

  if (!membership) {
    return c.json(
      {
        success: false,
        message: "You do not have access to this organization",
      },
      403,
    );
  }

  c.set("membership", membership);

  await next();
});