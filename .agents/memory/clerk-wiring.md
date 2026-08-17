---
name: Clerk whitelabel wiring
description: How Clerk auth is wired in this project and the rules to keep it working.
---

Rule: follow the Replit-managed Clerk skill reference code verbatim.
**Why:** deviations (conditional proxyUrl, token getters on web, proxy mounted after body parsers) break auth subtly, often only in production.
**How to apply:** api-server mounts `clerkProxyMiddleware()` at `CLERK_PROXY_PATH` before body parsers; `clerkMiddleware` derives publishableKey via `publishableKeyFromHost`; frontend `App.tsx` uses `publishableKeyFromHost(window.location.hostname, ...)` from `@clerk/react/internal` with unconditional `proxyUrl`; web auth is cookie-based — no token getters. Sign-in/up routes use `/sign-in/*?` wildcards. Tailwind v4 needs `@layer theme, base, clerk, components, utilities;` and `tailwindcss({ optimize: false })`.
