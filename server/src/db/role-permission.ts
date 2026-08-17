// import {
//   pgTable,
//   timestamp,
//   uuid,
// } from "drizzle-orm/pg-core";

// import { roles } from "./role";
// import { permissions } from "./permission";

// export const rolePermissions = pgTable("role_permission", {
//   roleId: uuid("role_id")
//     .notNull()
//     .references(() => roles.id, {
//       onDelete: "cascade",
//     }),

//   permissionId: uuid("permission_id")
//     .notNull()
//     .references(() => permissions.id, {
//       onDelete: "cascade",
//     }),

//   createdAt: timestamp("created_at")
//     .defaultNow()
//     .notNull(),
// });