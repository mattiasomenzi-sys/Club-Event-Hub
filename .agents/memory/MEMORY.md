# Memory index

- [Clerk whitelabel wiring](clerk-wiring.md) — copy the Replit-managed Clerk skill reference verbatim (proxy before body parsers, publishableKeyFromHost, no PROD gates on proxyUrl, cookie web auth without token getters).
- [Admin auth model](admin-auth.md) — admin key lives in settings table (DB row → ADMIN_KEY env → fail closed); never reintroduce hard-coded fallback keys; UI gates must always be mirrored server-side.
