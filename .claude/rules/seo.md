---
paths: ["src/app/**", "src/lib/seo/**"]
---
# SEO rules
- One H1 per page containing the primary term and "Bengaluru" where relevant. Title 50 to 60 chars with " | Espresso Academy India". Description 140 to 160 chars.
- Title patterns: hub "Barista & Coffee Courses in Bengaluru | Espresso Academy India"; course "{Course} | {Level} Barista Course in Bengaluru | Espresso Academy India"; trainer "{Name}, {Role} | Espresso Academy India".
- Canonical absolute self-referencing from NEXT_PUBLIC_SITE_URL. robots index by default; noindex on /thank-you, /dev/*.
- JSON-LD via src/lib/seo/schema.ts as one @graph: EducationalOrganization+LocalBusiness site-wide (address, telephone, sameAs Instagram + espressoacademy.it partner page); Course + hasCourseInstance (only when a date exists) + Offer (only when a fee exists) on course pages; Person + hasCredential on trainer pages; FAQPage where FAQs are visible; BreadcrumbList below home.
- sitemap.ts from data.ts; robots.ts allows all incl. GPTBot, ClaudeBot, PerplexityBot, Google-Extended; llms.txt route.
- Internal links: course <-> hub, course <-> prev/next level, course -> certification, course -> trainer, FAQ answer -> deep page. Descriptive anchor text, never "click here".
- Images: descriptive alt from data.ts (required field), descriptive file names, width/height set.
- OG image route per page type (Bebas title on white with red rule and the logo).
