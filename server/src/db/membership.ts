import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  text,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization";
import { facilities } from "./facility";

import { relations } from "drizzle-orm";



export const membershipRole = pgEnum("membership_role", [
  "organization_admin",
  "facility_admin",
  "doctor",
  "clinical_officer",
  "nurse",
  "receptionist",
  "pharmacist",
  "laboratory_technician",
  "radiologist",
  "cashier",
  "accountant",
  "inventory_manager",
]);

export type MembershipRole =
  (typeof membershipRole.enumValues)[number];

export const membershipStatus = pgEnum("membership_status", [
  "active",
  "suspended",
]);

export const memberships = pgTable("membership", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: text("user_id").notNull(),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),

  facilityId: uuid("facility_id")
    .references(() => facilities.id, {
      onDelete: "cascade",
    }),

  role: membershipRole("role").notNull(),

  status: membershipStatus("status")
    .notNull()
    .default("active"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const membershipRelations = relations(
  memberships,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [memberships.organizationId],
      references: [organizations.id],
    }),

    facility: one(facilities, {
      fields: [memberships.facilityId],
      references: [facilities.id],
    }),
  }),
);