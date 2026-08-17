import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";

// Link di invito a un evento, creati dall'admin.
// inviteType: "ospite" (non paga) | "regolare" (paga il biglietto all'ingresso)
export const invitesTable = pgTable("invites", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  inviteType: text("invite_type").notNull(), // "ospite" | "regolare"
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Invite = typeof invitesTable.$inferSelect;
