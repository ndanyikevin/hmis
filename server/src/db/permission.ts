import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const permissions = pgTable("permission", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull().unique(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});