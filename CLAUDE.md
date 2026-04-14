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

## Workflow (with CI/CD automation)

Feature development follows a staging-first flow with GitHub Actions auto-deployment.

### Environments & Auto-Deploy
| Environment | URL | KV Namespace | Deployment |
|---|---|---|---|
| Staging | https://rtgs-pgl-staging.selvaraj-s.workers.dev | Isolated (staging KV) | Auto-deploy on feature/* branch push (GitHub Actions) |
| Production | https://rtgs-pgl.selvaraj-s.workers.dev | Production KV | **Auto-deploy on main merge** (GitHub Actions) |

### Trigger words & Actions
| User says | Claude does |
|---|---|
| "commit it" | Create feature branch → git add → commit → push to feature/* → GitHub Actions auto-deploys to staging |
| "looks good, merge to main" | Squash merge to main → push to main → **GitHub Actions auto-deploys to PRODUCTION** ⚠️ |
| (Manual staging deploy only) | `npx wrangler deploy --env staging` (if needed without committing) |

### Testing rules
- **E2E tests (`npm run test:e2e`)** — **NEVER run automatically.** Only run when the user explicitly says so (e.g. "run E2E", "run the tests"). Reason: E2E tests hit the staging KV heavily and KV usage is limited. Do not run E2E as a routine step after every deploy.
- **Unit tests (`npm test`)** — run locally with Vitest, no deployment needed. These are safe to run freely.
- **E2E target** — always staging URL. Never local, never prod (unless explicitly requested for a production issue).
- **Production testing** — only if the user explicitly asks (e.g. investigating a prod bug).

### Story tracking rules
- **When feature is complete:** Automatically update `stories.md` with all commits for that feature
  - Add commit SHAs to the story's "Commits" table
  - Include the commit message from each related commit
  - Do not wait for user reminder — proactively update before finishing the feature work
  - This keeps stories.md as accurate, up-to-date documentation of feature implementations

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

### Player Gross Scores

**What:** Individual player scores recorded for Four Balls and Singles matches.

**Formats:**
- **Four Balls & Singles:** Mandatory gross score (integer 50–150) captured for each player
- **Alternate Shot & Scramble:** Marked as N/A (no individual scores)

**Workflow:**
1. Captain enters scores in EDIT modal alongside match result → submitted as `pending`
2. Other captain reviews (read-only display) → approves → scores confirmed
3. If disputed, scores remain in KV; admin can override via Override & Save
4. On match clear, scores deleted from KV

**Storage:** Separate KV key `season3_player_scores`
```
{ "1": { "E1": 82, "E4": 79, "U2": 85, "U5": 77 }, ... }
```

**Display:**
- **Edit modal:** 4 input fields for Four Balls, 2 for Singles, hidden for other formats
- **Match detail modal (fan view):** Shows gross scores for all players (gold text, below match result)
- **Player profile history:** 5-column table with gross score column (gold, visible on mobile with scroll)

**API:**
- `GET /api/scores` — public, returns all player scores
- `POST /api/scores` — auth: captain/admin, merge semantics (null = delete)

---

## Teams

### Team Europe
| # | Player | Handicap |
|---|--------|----------|
| E1 | Vikrant Patil | 16 |
| E2 | Anuj Pandey | 14 |
| E3 | Anirudha | 16 |
| E4 | Selva S Sundaram | 16 |
| E5 | Raghu Sundaram | 20 |
| E6 | Hemang C | 20 |
| E7 | Nimesh Dave | 20 |
| E8 | Bala Sankaran | 22 |

### Team USA
| # | Player | Handicap |
|---|--------|----------|
| U1 | Shailendra Singh | 14 |
| U2 | Satyapal P | 16 |
| U3 | John C | 16 |
| U4 | Rahul R | 16 |
| U5 | Mazz | 20 |
| U6 | Rushabh L | 20 |
| U7 | Srikant N | 22 |
| U8 | DZ | 20 |

**Team colours:**
- Team Europe: steel blue `#4a90c4`
- Team USA: crimson `#c44a4a`

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
