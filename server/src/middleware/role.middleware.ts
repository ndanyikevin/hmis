import { createMiddleware } from "hono/factory";
import type { HonoVariables } from "../types/hono";
import type { MembershipRole } from "../db/membership";

export const requireRole = (...allowedRoles: MembershipRole[]) =>
  createMiddleware<{
    Variables: HonoVariables;
  }>(async (c, next) => {
    const membership = c.get("membership");

    if (!allowedRoles.includes(membership.role)) {
      return c.json(
        {
          success: false,
          message: "Forbidden",
        },
        403,
      );
    }

    await next();
  });