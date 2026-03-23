# RTGS Premier Golf League — Claude Context

## Project Overview

A static website for the **RTGS Premier Golf League (RTGS PGL)**, hosted on **Cloudflare Workers** using Wrangler. The site is served from the `./public` directory as static assets.

- **Production URL:** https://rtgs-pgl.selvaraj-s.workers.dev
- **Staging URL:** https://rtgs-pgl-staging.selvaraj-s.workers.dev
- **Stack:** Cloudflare Workers + static HTML/CSS (no frameworks)
- **Deploy to staging:** `npx wrangler deploy --env staging`
- **Deploy to prod:** `npx wrangler deploy`
- **Dev command:** `npx wrangler dev` (runs on http://127.0.0.1:8787)

---

## Workflow (until CI/CD is set up)

Feature development follows a staging-first flow. **All work goes through staging before prod.**

### Environments
| Environment | URL | KV Namespace | When to deploy |
|---|---|---|---|
| Staging | https://rtgs-pgl-staging.selvaraj-s.workers.dev | Isolated (staging KV) | On every feature commit |
| Production | https://rtgs-pgl.selvaraj-s.workers.dev | Production KV | Only after explicit approval |

### Trigger words
| User says | Claude does |
|---|---|
| "commit it" | Create feature branch (if not already on one) → git add → commit → push to GitHub → `wrangler deploy --env staging` |
| "looks good, merge to main" | Squash merge feature branch → main → `wrangler deploy` (prod) → sync local main |

### Testing rules
- **E2E tests (`npm run test:e2e`)** — always run against staging URL. Never local, never prod (unless explicitly requested for a production issue).
- **Unit tests (`npm test`)** — run locally with Vitest, no deployment needed.
- **Production testing** — only if the user explicitly asks (e.g. investigating a prod bug).

---

## Pages

| File | Route | Purpose |
|------|-------|---------|
| `public/index.html` | `/` | Landing page — RTGS branding, links to Season 3 |
| `public/season3.html` | `/season3.html` | Season 3 full details page |

## Design System

### Style Rules
- **Theme:** Dark formal — inspired by PGA Tour / LIV Golf aesthetics
- **Background:** Deep navy `#0a1628`
- **Accent:** Gold `#c9a84c` / `#e8c97a` (light) / `#a07830` (dark)
- **Text:** White `#ffffff`, light grey `#d0d8e4`, mid grey `#9faec0`
- **Fonts:** `Playfair Display` (serif headings) + `Raleway` (sans-serif body/labels)
- **Borders:** `rgba(201,168,76,0.18)` gold-tinted borders throughout
- **Mobile breakpoint:** `@media (max-width: 640px)` — all multi-column grids stack on mobile

### Do Not
- Do not change the dark navy/gold colour scheme without being asked
- Do not add green golf colours — the pistachio green theme was replaced intentionally
- Do not use border-radius on cards/badges (sharp edges are intentional for the formal look)
- Do not add new pages without updating the nav and linking from existing pages

---

## Season 3 — 2026

### Format
Season 3 follows a **Ryder Cup-style** team competition across 10+ courses.

**Match formats (in order of play):**
1. **Four Balls** — Best ball (both partners play their own ball, lower score counts)
2. **Scramble** — Texas scramble (both hit, choose best shot, play from there)
3. **Alternate Shot** — Foursomes (partners share one ball, alternate shots)
4. **Singles** — 1v1 match play (final decisive session)

Matches are named **Match 1, Match 2, ... Match N** (no fancy event names).

### Points System
| Result | Points |
|--------|--------|
| Win | 1 pt |
| Halve | 0.5 pt each |
| Loss | 0 pt |

**Winning threshold: 14.5 points** — first team to reach 14.5 wins the Season 3 title.

---

## Teams

### Team Dhurandhar
| # | Player | Handicap |
|---|--------|----------|
| D1 | Vikrant Patil | 16 |
| D2 | Anuj Pandey | 14 |
| D3 | Anirudha | 16 |
| D4 | Selva S Sundaram | 16 |
| D5 | Raghu Sundaram | 20 |
| D6 | Hemang C | 20 |
| D7 | Nimesh Dave | 20 |
| D8 | Bala Sankaran | 22 |

### Team Rushabh
| # | Player | Handicap |
|---|--------|----------|
| R1 | Shailendra Singh | 14 |
| R2 | Satyapal P | 16 |
| R3 | John C | 16 |
| R4 | Rahul R | 16 |
| R5 | Mazz | 20 |
| R6 | Rushabh L | 20 |
| R7 | Srikant N | 22 |
| R8 | DZ | 16 |

**Team colours:**
- Team Dhurandhar: steel blue `#4a90c4`
- Team Rushabh: crimson `#c44a4a`

---

## Match Schedule

All matches TBD. The schedule table in `season3.html` has 11 rows (Match 1–10 + Singles finale). Courses and dates to be filled in as confirmed.

Format sequence used in the schedule:
- Matches 1–2: Four Balls
- Matches 3–4: Scramble
- Matches 5–7: Alternate Shot
- Match 8: Four Balls
- Match 9: Scramble
- Match 10: Alternate Shot
- Match 11+: Singles (finale)

---

## Development Notes

- After any change to `wrangler.jsonc` bindings, run `npx wrangler types`
- Always test mobile layout at 375px width (iPhone) before deploying
- The schedule table uses a horizontal scroll wrapper (`.schedule-table-wrap`) for mobile — keep this when editing the table
- The team clash banner uses CSS Grid `1fr auto 1fr` — on mobile it stacks to single column
- Handicaps shown as `HCP XX` format in the roster list
