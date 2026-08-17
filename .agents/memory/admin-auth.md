---
name: Admin auth model
description: How admin access works for the BOXX admin panel and the fail-closed rule.
---

Rule: admin key resolution is settings-table row → `ADMIN_KEY` env → fail closed (reject all admin requests). Recovery requires `RECOVERY_KEY` env, also fail closed.
**Why:** a hard-coded fallback key previously exposed a PII endpoint (member profiles with contact + sexual-interest data) to anyone reading the source.
**How to apply:** never add default key literals; every admin/PII endpoint must be gated server-side (client-side gating alone was flagged as an auth bypass — participate endpoint now requires Clerk userId + existing profile).
