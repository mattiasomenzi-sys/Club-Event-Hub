import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_KEY_SETTING = "admin_key";
const DETAILS_PASSWORD_SETTING = "details_password";

async function getAdminKey(): Promise<string> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, ADMIN_KEY_SETTING));
    if (row) return row.value;
  } catch { /* fall through */ }
  return process.env.ADMIN_KEY ?? "boxx-admin-2025";
}

async function getDetailsPassword(): Promise<string> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, DETAILS_PASSWORD_SETTING));
    if (row) return row.value;
  } catch { /* fall through */ }
  return process.env.DETAILS_PASSWORD ?? "boxx2026";
}

export { getAdminKey, getDetailsPassword };

router.post("/events/verify-details-password", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ ok: false, error: "Password mancante." });
    return;
  }
  const expected = await getDetailsPassword();
  if (password !== expected) {
    res.status(401).json({ ok: false, error: "Password non corretta." });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/details-password", async (req, res): Promise<void> => {
  const submittedKey = req.header("x-admin-key");
  const adminKey = await getAdminKey();
  if (submittedKey !== adminKey) {
    res.status(401).json({ error: "Non autorizzato." });
    return;
  }
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ error: "La password deve essere almeno 4 caratteri." });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key: DETAILS_PASSWORD_SETTING, value: newPassword })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newPassword } });
  res.json({ ok: true });
});

router.get("/admin/details-password", async (req, res): Promise<void> => {
  const submittedKey = req.header("x-admin-key");
  const adminKey = await getAdminKey();
  if (submittedKey !== adminKey) {
    res.status(401).json({ error: "Non autorizzato." });
    return;
  }
  const current = await getDetailsPassword();
  res.json({ password: current });
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
  if (currentKey !== actual) {
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
  const expected = process.env.RECOVERY_KEY ?? "boxx-recovery-2025";
  if (recoveryKey !== expected) {
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
