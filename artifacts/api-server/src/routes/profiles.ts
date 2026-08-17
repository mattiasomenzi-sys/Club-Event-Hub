import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { getAdminKey } from "./admin-auth";

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  getAdminKey().then((adminKey) => {
    if (req.headers["x-admin-key"] !== adminKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  }).catch(() => res.status(500).json({ error: "Internal error" }));
}

const MEMBER_TYPES = ["singolo", "coppia", "singola", "trav"] as const;
const INTERESTS = ["swinger", "sexpositive", "kinky", "gangbang"] as const;

function serialize(r: typeof profilesTable.$inferSelect) {
  return {
    id: r.id,
    nickname: r.nickname,
    age: r.age,
    email: r.email,
    telegram: r.telegram,
    whatsapp: r.whatsapp,
    memberType: r.memberType,
    interests: r.interests,
    consentEmail: r.consentEmail,
    consentMessages: r.consentMessages,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

router.get("/profile/me", async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId));
  if (!row) {
    res.status(404).json({ error: "Profilo non trovato" });
    return;
  }
  res.json(serialize(row));
});

router.put("/profile/me", async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const age = typeof body.age === "number" && Number.isInteger(body.age) ? body.age : NaN;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const telegram = typeof body.telegram === "string" ? body.telegram.trim() : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const memberType = body.memberType as string;
  const rawInterests = Array.isArray(body.interests) ? body.interests : null;

  if (!nickname) { res.status(400).json({ error: "Nickname richiesto" }); return; }
  if (!Number.isInteger(age) || age < 18 || age > 120) { res.status(400).json({ error: "Età non valida (minimo 18)" }); return; }
  if (!email || !email.includes("@")) { res.status(400).json({ error: "Email non valida" }); return; }
  if (!telegram && !whatsapp) { res.status(400).json({ error: "Inserisci almeno un contatto (Telegram o WhatsApp)" }); return; }
  if (!MEMBER_TYPES.includes(memberType as typeof MEMBER_TYPES[number])) { res.status(400).json({ error: "Tipologia non valida" }); return; }
  if (!rawInterests || rawInterests.some((i) => !INTERESTS.includes(i as typeof INTERESTS[number]))) {
    res.status(400).json({ error: "Interessi non validi" });
    return;
  }
  const interests = [...new Set(rawInterests as string[])];
  if (typeof body.consentEmail !== "boolean" || typeof body.consentMessages !== "boolean") {
    res.status(400).json({ error: "Indica se autorizzi email e messaggi" });
    return;
  }

  const values = {
    clerkUserId: userId,
    nickname,
    age,
    email,
    telegram: telegram || null,
    whatsapp: whatsapp || null,
    memberType,
    interests,
    consentEmail: body.consentEmail,
    consentMessages: body.consentMessages,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(profilesTable)
    .values(values)
    .onConflictDoUpdate({ target: profilesTable.clerkUserId, set: values })
    .returning();
  res.json(serialize(row));
});

router.get("/profiles", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(profilesTable)
    .orderBy(desc(profilesTable.createdAt));
  res.json(rows.map(serialize));
});

export default router;
