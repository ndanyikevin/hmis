import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { organizations } from "./organization";
import { facilities } from "./facility";

import { membershipRole } from "./membership";

export const invitationStatusEnum = pgEnum(
  "invitation_status",
  [
    "pending",
    "accepted",
    "expired",
    "revoked",
  ],
);

export const staffInvitations = pgTable("staff_invitation", {
  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  email: text("email")
    .notNull(),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),

  facilityId: uuid("facility_id")
    .notNull()
    .references(() => facilities.id, {
      onDelete: "cascade",
    }),

  role: membershipRole("role")
    .notNull(),

  token: text("token")
    .notNull()
    .unique(),

  status: invitationStatusEnum("status")
    .default("pending")
    .notNull(),

  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id),

  expiresAt: timestamp("expires_at")
    .notNull(),

  acceptedAt: timestamp("accepted_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});