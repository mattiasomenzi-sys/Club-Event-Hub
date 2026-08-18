import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, invitesTable, eventsTable, participationsTable } from "@workspace/db";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();

const INVITE_TYPES = ["ospite", "regolare"] as const;

// Data "di oggi" secondo il fuso del club (Europe/Rome)
export function todayRome(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
}

// Crea un link di invito per un evento (solo admin)
router.post("/admin/events/:id/invites", requireAdmin, async (req, res): Promise<void> => {
  const eventId = Number(req.params.id);
  const { inviteType, note, occurrenceDate } = req.body as { inviteType?: unknown; note?: unknown; occurrenceDate?: unknown };
  if (!INVITE_TYPES.includes(inviteType as (typeof INVITE_TYPES)[number])) {
    res.status(400).json({ error: "Tipo di invito non valido" });
    return;
  }
  // La data della serata è obbligatoria e deve essere una data reale non passata
  if (typeof occurrenceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
    res.status(400).json({ error: "Data della serata richiesta" });
    return;
  }
  const parsed = new Date(occurrenceDate + "T00:00:00Z");
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== occurrenceDate) {
    res.status(400).json({ error: "Data non valida" });
    return;
  }
  if (occurrenceDate < todayRome()) {
    res.status(400).json({ error: "La data della serata è già passata" });
    return;
  }
  const normalizedOccurrence = occurrenceDate;
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }
  const token = randomBytes(12).toString("base64url");
  const [invite] = await db
    .insert(invitesTable)
    .values({
      eventId,
      token,
      inviteType: inviteType as string,
      note: typeof note === "string" && note.trim() ? note.trim().slice(0, 200) : null,
      occurrenceDate: normalizedOccurrence,
    })
    .returning();
  res.status(201).json(invite);
});

// Lista inviti di un evento con numero di iscritti arrivati da ciascun invito (solo admin)
router.get("/admin/events/:id/invites", requireAdmin, async (req, res): Promise<void> => {
  const eventId = Number(req.params.id);
  const rows = await db
    .select({
      id: invitesTable.id,
      token: invitesTable.token,
      inviteType: invitesTable.inviteType,
      note: invitesTable.note,
      occurrenceDate: invitesTable.occurrenceDate,
      createdAt: invitesTable.createdAt,
      uses: sql<number>`(SELECT count(*)::int FROM participations p WHERE p.invite_id = ${invitesTable.id})`,
    })
    .from(invitesTable)
    .where(eq(invitesTable.eventId, eventId))
    .orderBy(invitesTable.createdAt);
  res.json(rows);
});

// Elimina un invito (il link smette di funzionare; le iscrizioni già fatte restano)
router.delete("/admin/invites/:id", requireAdmin, async (req, res): Promise<void> => {
  await db.delete(invitesTable).where(eq(invitesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// Info pubbliche su un invito (per la pagina evento)
router.get("/invites/:token", async (req, res): Promise<void> => {
  const [invite] = await db
    .select()
    .from(invitesTable)
    .where(eq(invitesTable.token, String(req.params.token)));
  if (!invite) {
    res.status(404).json({ error: "Invito non valido" });
    return;
  }
  // Invito legato a una serata: scade il giorno dopo
  const today = todayRome();
  if (invite.occurrenceDate && invite.occurrenceDate < today) {
    res.status(410).json({ error: "Invito scaduto", occurrenceDate: invite.occurrenceDate });
    return;
  }
  res.json({ eventId: invite.eventId, inviteType: invite.inviteType, occurrenceDate: invite.occurrenceDate });
});

export default router;
