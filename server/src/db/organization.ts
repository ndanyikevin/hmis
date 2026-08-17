import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { facilities } from "./facility";
import { memberships } from "./membership";

export const organizationStatus = pgEnum("organization_status", [
  "active",
  "suspended",
]);

export const organizations = pgTable("organization", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  slug: text("slug").notNull().unique(),

  status: organizationStatus("status")
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

export const organizationRelations = relations(
  organizations,
  ({ many }) => ({
    facilities: many(facilities),
    memberships: many(memberships),
  }),
);



