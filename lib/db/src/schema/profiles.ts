import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  nickname: text("nickname").notNull(),
  age: integer("age").notNull(),
  email: text("email").notNull(),
  contactMethod: text("contact_method").notNull(), // "telegram" | "whatsapp"
  contactValue: text("contact_value").notNull(),
  memberType: text("member_type").notNull(), // "singolo" | "coppia" | "singola" | "trav"
  interests: text("interests").array().notNull().default([]), // "swinger" | "sexpositive" | "kinky"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
