import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
