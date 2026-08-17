import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, invitesTable, eventsTable, participationsTable } from "@workspace/db";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();

const INVITE_TYPES = ["ospite", "regolare"] as const;

// Crea un link di invito per un evento (solo admin)
router.post("/admin/events/:id/invites", requireAdmin, async (req, res): Promise<void> => {
  const eventId = Number(req.params.id);
  const { inviteType, note } = req.body as { inviteType?: unknown; note?: unknown };
  if (!INVITE_TYPES.includes(inviteType as (typeof INVITE_TYPES)[number])) {
    res.status(400).json({ error: "Tipo di invito non valido" });
    return;
  }
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
  res.json({ eventId: invite.eventId, inviteType: invite.inviteType });
});

export default router;
