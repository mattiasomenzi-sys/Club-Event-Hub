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

const router: IRouter = Router();

function serializeEvent(event: Record<string, unknown>) {
  return {
    ...event,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
  };
}

function requireAdminKey(req: Parameters<Parameters<IRouter["use"]>[0]>[0], res: Parameters<Parameters<IRouter["use"]>[0]>[1], next: Parameters<Parameters<IRouter["use"]>[0]>[2]): void {
  const adminKey = process.env.ADMIN_KEY ?? "boxx-admin-2025";
  const provided = req.headers["x-admin-key"];
  if (provided !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
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
