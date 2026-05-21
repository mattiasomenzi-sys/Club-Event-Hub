import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    referrerHost: text("referrer_host"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    device: text("device"),
    browser: text("browser"),
    os: text("os"),
    language: text("language"),
    timezone: text("timezone"),
    screen: text("screen"),
    sessionId: text("session_id"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("page_views_created_at_idx").on(t.createdAt),
    pathIdx: index("page_views_path_idx").on(t.path),
    sessionIdx: index("page_views_session_idx").on(t.sessionId),
  }),
);

export type PageView = typeof pageViewsTable.$inferSelect;
