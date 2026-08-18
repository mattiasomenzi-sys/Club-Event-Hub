import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";

export const participationsTable = pgTable("participations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  photoUrl: text("photo_url"),
  inviteId: integer("invite_id"),
  inviteType: text("invite_type"), // "ospite" | "regolare" se arrivato tramite invito
  clerkUserId: text("clerk_user_id"), // chi si è iscritto (per "i miei eventi")
  occurrenceDate: date("occurrence_date", { mode: "string" }), // data della serata (eventi ricorrenti)
  qrToken: text("qr_token"), // codice univoco per il QR della prenotazione
  status: text("status").notNull().default("confermata"), // "in_attesa" (iscrizione autonoma) | "confermata"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Participation = typeof participationsTable.$inferSelect;
