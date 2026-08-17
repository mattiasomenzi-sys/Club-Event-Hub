import { Router, type IRouter } from "express";
import type { Request, Response, NextFunction } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";

const router: IRouter = Router();

const ADMIN_KEY_SETTING = "admin_key";
const ADMIN_EMAILS_SETTING = "admin_emails";

// Email degli utenti (login Clerk) che hanno accesso admin.
async function getAdminEmails(): Promise<string[]> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, ADMIN_EMAILS_SETTING));
    if (row) {
      return row.value.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    }
  } catch { /* fall through */ }
  return [];
}

async function isClerkAdmin(req: Request): Promise<boolean> {
  const { userId } = getAuth(req);
  if (!userId) return false;
  const emails = await getAdminEmails();
  if (emails.length === 0) return false;
  try {
    const user = await clerkClient.users.getUser(userId);
    const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    return userEmails.some((e) => emails.includes(e));
  } catch {
    return false;
  }
}

// Vero se la richiesta ha la chiave admin (header X-Admin-Key)
// oppure arriva da un utente loggato la cui email è nella lista admin.
export async function isAdminRequest(req: Request): Promise<boolean> {
  const headerKey = req.headers["x-admin-key"];
  if (typeof headerKey === "string" && headerKey.length > 0) {
    const adminKey = await getAdminKey();
    if (adminKey !== null && headerKey === adminKey) return true;
  }
  return isClerkAdmin(req);
}

// Middleware condiviso per gli endpoint admin.
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  isAdminRequest(req)
    .then((ok) => (ok ? next() : res.status(401).json({ error: "Unauthorized" })))
    .catch(() => res.status(500).json({ error: "Internal error" }));
}

// Ritorna la chiave admin. Fail-closed: se non c'è né la riga nel DB né la
// variabile d'ambiente ADMIN_KEY, ritorna null e ogni endpoint admin rifiuta.
async function getAdminKey(): Promise<string | null> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, ADMIN_KEY_SETTING));
    if (row) return row.value;
  } catch { /* fall through */ }
  return process.env.ADMIN_KEY ?? null;
}

export { getAdminKey };

// L'utente loggato può chiedere se è admin (per saltare la richiesta di chiave).
router.get("/admin/whoami", async (req, res): Promise<void> => {
  res.json({ isAdmin: await isClerkAdmin(req) });
});

router.post("/admin/change-key", async (req, res): Promise<void> => {
  const { currentKey, newKey } = req.body as { currentKey?: string; newKey?: string };
  if (!currentKey || !newKey) {
    res.status(400).json({ error: "Parametri mancanti." });
    return;
  }
  if (newKey.length < 8) {
    res.status(400).json({ error: "La chiave deve essere almeno 8 caratteri." });
    return;
  }
  const actual = await getAdminKey();
  if (actual === null || currentKey !== actual) {
    res.status(401).json({ error: "Chiave attuale non corretta." });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key: ADMIN_KEY_SETTING, value: newKey })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newKey } });
  res.json({ ok: true });
});

router.post("/admin/recover-key", async (req, res): Promise<void> => {
  const { recoveryKey, newKey } = req.body as { recoveryKey?: string; newKey?: string };
  if (!recoveryKey || !newKey) {
    res.status(400).json({ error: "Parametri mancanti." });
    return;
  }
  if (newKey.length < 8) {
    res.status(400).json({ error: "La chiave deve essere almeno 8 caratteri." });
    return;
  }
  const expected = process.env.RECOVERY_KEY;
  if (!expected || recoveryKey !== expected) {
    res.status(401).json({ error: "Codice di recupero non valido." });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key: ADMIN_KEY_SETTING, value: newKey })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newKey } });
  res.json({ ok: true });
});

export default router;
