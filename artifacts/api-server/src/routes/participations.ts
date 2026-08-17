import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, participationsTable, profilesTable, invitesTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { requireAdmin, isAdminRequest } from "./admin-auth";

const router = Router();


router.post("/events/:id/participate", async (req: Request, res: Response): Promise<void> => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event id" }); return; }

  // Partecipare richiede login e profilo completo (enforced lato server)
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Devi accedere per partecipare" }); return; }
  const [profile] = await db
    .select({ id: profilesTable.id, photoUrl: profilesTable.photoUrl })
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId));
  if (!profile) { res.status(403).json({ error: "Completa il tuo profilo per partecipare" }); return; }

  const [event] = await db.select({
    id: eventsTable.id,
    isDraft: eventsTable.isDraft,
    photoRequirement: eventsTable.photoRequirement,
  }).from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event || event.isDraft) { res.status(404).json({ error: "Event not found" }); return; }

  const { name, contact, photoUrl, inviteToken } = req.body as {
    name?: unknown; contact?: unknown; photoUrl?: unknown; inviteToken?: unknown;
  };
  if (typeof name !== "string" || !name.trim()) { res.status(400).json({ error: "Nome richiesto" }); return; }
  if (typeof contact !== "string" || !contact.trim()) { res.status(400).json({ error: "Contatto richiesto" }); return; }

  let normalizedPhoto: string | null = null;
  if (typeof photoUrl === "string" && photoUrl.trim()) {
    const p = photoUrl.trim();
    // Accept only references to our object storage
    if (!p.startsWith("/objects/")) { res.status(400).json({ error: "Foto non valida" }); return; }
    normalizedPhoto = p;
  }
  // Se non è stata caricata una foto, usa quella del profilo
  if (!normalizedPhoto && profile.photoUrl) normalizedPhoto = profile.photoUrl;
  if (event.photoRequirement === "required" && !normalizedPhoto) {
    res.status(400).json({ error: "Foto obbligatoria: caricala qui o nel tuo profilo" });
    return;
  }

  // Invito (opzionale): deve esistere ed essere di questo evento
  let invite: { id: number; inviteType: string } | null = null;
  if (typeof inviteToken === "string" && inviteToken.trim()) {
    const [inv] = await db
      .select({ id: invitesTable.id, eventId: invitesTable.eventId, inviteType: invitesTable.inviteType })
      .from(invitesTable)
      .where(eq(invitesTable.token, inviteToken.trim()));
    if (!inv || inv.eventId !== eventId) {
      res.status(400).json({ error: "Invito non valido per questo evento" });
      return;
    }
    invite = { id: inv.id, inviteType: inv.inviteType };
  }

  const [row] = await db.insert(participationsTable).values({
    eventId,
    name: name.trim(),
    contact: contact.trim(),
    photoUrl: normalizedPhoto,
    inviteId: invite?.id ?? null,
    inviteType: invite?.inviteType ?? null,
  }).returning();

  res.status(201).json({
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    contact: row.contact,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  });
});

router.get("/events/:id/participations", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event id" }); return; }

  const rows = await db
    .select()
    .from(participationsTable)
    .where(eq(participationsTable.eventId, eventId))
    .orderBy(participationsTable.createdAt);

  res.json(rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    name: r.name,
    contact: r.contact,
    photoUrl: r.photoUrl,
    inviteType: r.inviteType,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

export default router;
