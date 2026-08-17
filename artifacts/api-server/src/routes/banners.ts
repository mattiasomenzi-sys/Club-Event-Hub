import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
import { requireAdmin, isAdminRequest } from "./admin-auth";

const router = Router();


function serialize(r: typeof bannersTable.$inferSelect) {
  return {
    id: r.id,
    imageUrl: r.imageUrl,
    caption: r.caption,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get("/banners", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(bannersTable)
    .orderBy(asc(bannersTable.sortOrder), asc(bannersTable.id));
  res.json(rows.map(serialize));
});

router.post("/banners", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { imageUrl, caption, sortOrder } = req.body as { imageUrl?: unknown; caption?: unknown; sortOrder?: unknown };
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    res.status(400).json({ error: "imageUrl richiesto" });
    return;
  }
  const [row] = await db.insert(bannersTable).values({
    imageUrl: imageUrl.trim(),
    caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    sortOrder: typeof sortOrder === "number" && Number.isFinite(sortOrder) ? sortOrder : 0,
  }).returning();
  res.status(201).json(serialize(row));
});

router.delete("/banners/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const result = await db.delete(bannersTable).where(eq(bannersTable.id, id)).returning();
  if (result.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
