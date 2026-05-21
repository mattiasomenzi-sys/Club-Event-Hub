import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import {
  ListEventsResponse,
  GetEventParams,
  GetEventResponse,
  CreateEventBody,
  UpdateEventParams,
  UpdateEventBody,
  UpdateEventResponse,
  DeleteEventParams,
} from "@workspace/api-zod";
import { getAdminKey } from "./admin-auth";

const router: IRouter = Router();

function serializeEvent(event: Record<string, unknown>) {
  // Never expose the per-event password publicly
  const { password: _omit, ...rest } = event as { password?: unknown } & Record<string, unknown>;
  void _omit;
  return {
    ...rest,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
  };
}

import type { Request, Response, NextFunction } from "express";

function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  getAdminKey().then((adminKey) => {
    const provided = req.headers["x-admin-key"];
    if (provided !== adminKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  }).catch(() => {
    res.status(500).json({ error: "Internal error" });
  });
}

router.get("/events", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(eventsTable)
    .orderBy(asc(eventsTable.date));
  res.json(ListEventsResponse.parse(events.map(serializeEvent)));
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, params.data.id));

  if (!event) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }

  res.json(GetEventResponse.parse(serializeEvent(event)));
});

router.post("/events", requireAdminKey, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(eventsTable)
    .values({
      ...parsed.data,
      description: parsed.data.description ?? "",
    })
    .returning();

  res.status(201).json(GetEventResponse.parse(serializeEvent(event)));
});

router.patch("/events/:id", requireAdminKey, async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .update(eventsTable)
    .set(parsed.data)
    .where(eq(eventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }

  res.json(UpdateEventResponse.parse(serializeEvent(event)));
});

router.post("/events/:id/verify-password", async (req, res): Promise<void> => {
  const idNum = Number(req.params.id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    res.status(400).json({ ok: false, error: "ID non valido." });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ ok: false, error: "Password mancante." });
    return;
  }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, idNum));
  if (!event) {
    res.status(404).json({ ok: false, error: "Evento non trovato." });
    return;
  }
  if (!event.isPasswordProtected || !event.password) {
    // Not actually protected — allow through
    res.json({ ok: true });
    return;
  }
  if (password !== event.password) {
    res.status(401).json({ ok: false, error: "Password non corretta." });
    return;
  }
  res.json({ ok: true });
});

router.delete("/events/:id", requireAdminKey, async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .delete(eventsTable)
    .where(eq(eventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Evento non trovato" });
    return;
  }

  res.sendStatus(204);
});

export default router;
