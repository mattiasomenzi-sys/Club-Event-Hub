import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";

export const participationsTable = pgTable("participations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Participation = typeof participationsTable.$inferSelect;
