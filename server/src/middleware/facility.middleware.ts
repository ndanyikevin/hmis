import { createMiddleware } from "hono/factory";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { memberships } from "../db/schema";
import type { HonoVariables } from "../types/hono";

export const requireFacilityAccess = createMiddleware<{
  Variables: HonoVariables;
}>(async (c, next) => {
  const user = c.get("user");
  const membership = c.get("membership");

  const facilityId = c.req.header("X-Facility-Id");

  if (!facilityId) {
    return c.json(
      {
        success: false,
        message: "Facility ID is required",
      },
      400,
    );
  }

  const facilityMembership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.id, membership.id),
      eq(memberships.userId, user.id),
      eq(memberships.organizationId, membership.organizationId),
      eq(memberships.facilityId, facilityId),
      eq(memberships.status, "active"),
    ),
  });

  if (!facilityMembership) {
    return c.json(
      {
        success: false,
        message: "You do not have access to this facility",
      },
      403,
    );
  }

  await next();
});