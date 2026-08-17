import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, pageViewsTable } from "@workspace/db";
import { and, gte, sql, desc, count } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { createHash } from "node:crypto";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import { requireAdmin, isAdminRequest } from "./admin-auth";

const router: IRouter = Router();

function clientIp(req: Request): string {
  const xff = (req.headers["x-forwarded-for"] as string | undefined) ?? "";
  const first = xff.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "0.0.0.0";
}

function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET ?? "boxx-salt";
  return createHash("sha256").update(salt + "|" + ip).digest("hex").slice(0, 32);
}

function safeHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
}


router.post("/track", async (req, res): Promise<void> => {
  try {
    const body = (req.body ?? {}) as {
      path?: string;
      referrer?: string | null;
      language?: string | null;
      timezone?: string | null;
      screen?: string | null;
      sessionId?: string | null;
    };
    const path = (body.path ?? "").slice(0, 512);
    if (!path) { res.status(400).json({ error: "path required" }); return; }

    const ip = clientIp(req);
    const ipHash = hashIp(ip);
    const geo = geoip.lookup(ip);

    const ua = new UAParser((req.headers["user-agent"] as string) ?? "").getResult();
    const deviceType = ua.device.type ?? "desktop";

    // Privacy: keep only the referrer hostname (full URLs may include tokens/PII).
    const referrerHost = safeHost(body.referrer ?? null);

    // UTM params parsed from the path (if present)
    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    try {
      const u = new URL(path, "http://x");
      utmSource = u.searchParams.get("utm_source");
      utmMedium = u.searchParams.get("utm_medium");
      utmCampaign = u.searchParams.get("utm_campaign");
    } catch { /* ignore */ }

    await db.insert(pageViewsTable).values({
      path: path.split("?")[0]!.slice(0, 256),
      referrer: null,
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      country: geo?.country ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
      device: deviceType,
      browser: ua.browser.name ?? null,
      os: ua.os.name ?? null,
      language: (body.language ?? (req.headers["accept-language"] as string | undefined)?.split(",")[0] ?? null)?.slice(0, 16) ?? null,
      timezone: body.timezone?.slice(0, 64) ?? null,
      screen: body.screen?.slice(0, 32) ?? null,
      sessionId: body.sessionId?.slice(0, 64) ?? null,
      ipHash,
    });

    res.status(204).end();
  } catch (err) {
    req.log?.error({ err }, "track failed");
    res.status(204).end(); // never break the client
  }
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = gte(pageViewsTable.createdAt, since);

  async function topBy(col: PgColumn, limit = 10) {
    const rows = await db
      .select({ key: col, count: count() })
      .from(pageViewsTable)
      .where(and(where, sql`${col} is not null`))
      .groupBy(col)
      .orderBy(desc(count()))
      .limit(limit);
    return rows.map((r) => ({ key: (r.key as string | null) ?? "—", count: Number(r.count) }));
  }

  const [totals] = await db
    .select({
      total: count(),
      uniqueVisitors: sql<number>`count(distinct ${pageViewsTable.ipHash})`,
      uniqueSessions: sql<number>`count(distinct ${pageViewsTable.sessionId})`,
    })
    .from(pageViewsTable)
    .where(where);

  const timeline = await db
    .select({
      day: sql<string>`to_char(${pageViewsTable.createdAt} at time zone 'Europe/Rome', 'YYYY-MM-DD')`,
      views: count(),
      visitors: sql<number>`count(distinct ${pageViewsTable.ipHash})`,
    })
    .from(pageViewsTable)
    .where(where)
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const [paths, referrers, countries, devices, browsers, oses, languages, utmSources] = await Promise.all([
    topBy(pageViewsTable.path, 15),
    topBy(pageViewsTable.referrerHost, 15),
    topBy(pageViewsTable.country, 20),
    topBy(pageViewsTable.device, 10),
    topBy(pageViewsTable.browser, 10),
    topBy(pageViewsTable.os, 10),
    topBy(pageViewsTable.language, 10),
    topBy(pageViewsTable.utmSource, 10),
  ]);

  // Direct vs referral split
  const [directRow] = await db
    .select({ direct: count() })
    .from(pageViewsTable)
    .where(and(where, sql`${pageViewsTable.referrerHost} is null`));

  res.json({
    days,
    since: since.toISOString(),
    totals: {
      views: Number(totals?.total ?? 0),
      uniqueVisitors: Number(totals?.uniqueVisitors ?? 0),
      sessions: Number(totals?.uniqueSessions ?? 0),
      direct: Number(directRow?.direct ?? 0),
    },
    timeline: timeline.map((t) => ({ day: t.day, views: Number(t.views), visitors: Number(t.visitors) })),
    paths,
    referrers,
    countries,
    devices,
    browsers,
    oses,
    languages,
    utmSources,
  });
});

export default router;
