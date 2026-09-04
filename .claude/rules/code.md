---
paths: ["src/**"]
---
# Code rules
- TypeScript strict; no `any`; explicit prop interfaces; named exports; no barrel files.
- Server Components by default. `"use client"` only for interaction; add a comment saying why.
- Data comes from content/data.ts via typed helpers in src/lib/content.ts (getCourses, getCourse, getTrainers...).
- Images only through next/image with width/height or fill+sizes. Placeholder component in src/components/site/Placeholder.tsx.
- Env access only via src/lib/env.ts (zod). Missing RESEND_API_KEY must not crash; the form then routes to WhatsApp.
- Route handlers: POST only, zod validation, honeypot, minimum time-on-form 2s, generic errors, structured server logs.
- No new dependency over 15KB gz without a reason in docs/STATUS.md.
- Error boundaries: app/error.tsx and app/not-found.tsx styled with tokens, both link to /courses and WhatsApp.
