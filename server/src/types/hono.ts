import type { auth } from "../lib/auth";
import type { memberships } from "../db/schema";

export type HonoVariables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
  membership: typeof memberships.$inferSelect;
};