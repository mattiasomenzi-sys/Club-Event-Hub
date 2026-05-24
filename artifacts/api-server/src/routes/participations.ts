import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, participationsTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
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

router.post("/events/:id/participate", async (req: Request, res: Response): Promise<void> => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event id" }); return; }

  const [event] = await db.select({
    id: eventsTable.id,
    isDraft: eventsTable.isDraft,
    photoRequirement: eventsTable.photoRequirement,
  }).from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event || event.isDraft) { res.status(404).json({ error: "Event not found" }); return; }

  const { name, contact, photoUrl } = req.body as { name?: unknown; contact?: unknown; photoUrl?: unknown };
  if (typeof name !== "string" || !name.trim()) { res.status(400).json({ error: "Nome richiesto" }); return; }
  if (typeof contact !== "string" || !contact.trim()) { res.status(400).json({ error: "Contatto richiesto" }); return; }

  let normalizedPhoto: string | null = null;
  if (typeof photoUrl === "string" && photoUrl.trim()) {
    const p = photoUrl.trim();
    // Accept only references to our object storage
    if (!p.startsWith("/objects/")) { res.status(400).json({ error: "Foto non valida" }); return; }
    normalizedPhoto = p;
  }
  if (event.photoRequirement === "required" && !normalizedPhoto) {
    res.status(400).json({ error: "Foto obbligatoria" });
    return;
  }

  const [row] = await db.insert(participationsTable).values({
    eventId,
    name: name.trim(),
    contact: contact.trim(),
    photoUrl: normalizedPhoto,
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
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

export default router;
