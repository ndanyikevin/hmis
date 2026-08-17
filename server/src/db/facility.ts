import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { relations } from "drizzle-orm";
import { memberships } from "./membership";

export const facilityType = pgEnum("facility_type", [
  "hospital",
  "clinic",
  "medical_center",
  "health_center",
]);

export const facilityCareType = pgEnum("facility_care_type", [
  "outpatient",
  "inpatient",
  "both",
]);

export const facilityStatus = pgEnum("facility_status", [
  "active",
  "inactive",
]);

export const facilities = pgTable("facility", {
  id: uuid("id").defaultRandom().primaryKey(),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),

  name: text("name").notNull(),

  code: text("code").notNull(),

  type: facilityType("type").notNull(),

  careType: facilityCareType("care_type")
  .notNull()
  .default("outpatient"),

  status: facilityStatus("status")
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

export const facilityRelations = relations(
  facilities,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [facilities.organizationId],
      references: [organizations.id],
    }),

    memberships: many(memberships),
  }),
);