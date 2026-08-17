import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { requireAdmin } from "./admin-auth";

const router: IRouter = Router();

const FROM_ADDRESS = "BOXX Club <onboarding@resend.dev>";

// Invia una email (promo/novità) a tutti gli utenti con profilo completo.
router.post("/admin/send-email", requireAdmin, async (req, res): Promise<void> => {
  const { subject, message } = req.body as { subject?: unknown; message?: unknown };
  if (typeof subject !== "string" || !subject.trim()) {
    res.status(400).json({ error: "Oggetto richiesto" });
    return;
  }
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Messaggio richiesto" });
    return;
  }

  const rows = await db.select({ email: profilesTable.email }).from(profilesTable);
  const emails = [...new Set(rows.map((r) => r.email.trim().toLowerCase()).filter((e) => e.includes("@")))];
  if (emails.length === 0) {
    res.status(400).json({ error: "Nessun utente iscritto a cui inviare" });
    return;
  }

  const html = `
    <div style="background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:32px;">
      <h1 style="color:#FF006E;letter-spacing:2px;margin:0 0 24px;">BOXX</h1>
      <h2 style="color:#fff;margin:0 0 16px;">${escapeHtml(subject.trim())}</h2>
      <div style="color:#ddd;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message.trim())}</div>
      <p style="color:#666;font-size:12px;margin-top:32px;">BOXX Club — Lago di Garda</p>
    </div>`;

  const connectors = new ReplitConnectors();
  let sent = 0;
  const failures: string[] = [];

  // Invio singolo per destinatario (bcc-like: nessuno vede gli altri indirizzi)
  for (const to of emails) {
    try {
      const r = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject: subject.trim(), html }),
      });
      if (r.ok) sent++;
      else failures.push(to);
    } catch {
      failures.push(to);
    }
  }

  res.json({ sent, failed: failures.length, total: emails.length });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default router;
