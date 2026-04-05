# RTGS PGL — Story Tracker

_JIRA-ready format. Each story maps 1:1 to a JIRA issue when migrated._

**Priority scale:** P0 = blocker · P1 = high · P2 = medium · P3 = low / nice-to-have
**Types:** Feature · Bug · Chore · Data
**Statuses:** Done · In Progress · Planned · Deferred

---

## Index

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| [PGL-001](#pgl-001) | Real Backend — Cloudflare KV | Feature | P0 | Done |
| [PGL-002](#pgl-002) | Live Leaderboard | Feature | P1 | Done |
| [PGL-003](#pgl-003) | Dual-Captain Score Approval | Feature | P1 | Done |
| [PGL-004](#pgl-004) | Player Profiles | Feature | P1 | Done |
| [PGL-005](#pgl-005) | Photo Gallery | Feature | P1 | Done |
| [PGL-006](#pgl-006) | Head-to-Head Stats & Season Leaderboard | Feature | P1 | Done |
| [PGL-007](#pgl-007) | Help Icon & Feedback Modal | Feature | P2 | Done |
| [PGL-008](#pgl-008) | DZ Handicap Correction (16 → 20) | Data | P0 | Done |
| [PGL-009](#pgl-009) | Singles Schedule Redesign (M25–M40) | Data | P0 | Done |
| [PGL-010](#pgl-010) | M1 / M4 Opponent Swap | Data | P1 | Done |
| [PGL-011](#pgl-011) | Playoff Scenarios & Clinching Drama | Feature | P1 | Planned |
| [PGL-012](#pgl-012) | Pre-Match Lineup Card | Feature | P2 | Planned |
| [PGL-013](#pgl-013) | Streak Tracker & Weekly Awards | Feature | P2 | Planned |
| [PGL-014](#pgl-014) | Match Day Page | Feature | P2 | Planned |
| [PGL-015](#pgl-015) | Post-Match Replay & Highlights | Feature | P2 | Planned |
| [PGL-016](#pgl-016) | Notifications / Announcements | Feature | P3 | Deferred |
| [PGL-017](#pgl-017) | Match Predictions | Feature | P3 | Deferred |
| [PGL-018](#pgl-018) | Season Archive | Feature | P3 | Deferred |
| [PGL-019](#pgl-019) | SaaS / Multi-League Platform | Feature | P3 | Deferred |
| [PGL-020](#pgl-020) | Auth Security Audit — Credentials Compliance | Chore | P1 | Done |
| [PGL-021](#pgl-021) | Application Architecture SVG Diagram | Chore | P2 | Planned |
| [PGL-029](#pgl-029) | Custom Domain for Staging — staging.rtgspgl.org | Chore | P2 | Planned |
| [PGL-028](#pgl-028) | Capture City & ISP in Analytics Events | Feature | P2 | Planned |
| [PGL-027](#pgl-027) | Extend Analytics Access to Captains and Organisers | Feature | P2 | Planned |
| [PGL-026](#pgl-026) | Gallery Audit Log — Upload & Delete Tracking | Feature | P1 | Planned |
| [PGL-025](#pgl-025) | Course Names Popup — "10+ Courses" hero click | Feature | P2 | Done |
| [PGL-024](#pgl-024) | Score Update Audit Log | Feature | P1 | Planned |
| [PGL-022](#pgl-022) | Team Name Rename — Dhurandhar → Europe, Rushabh → USA | Data | P1 | Done |
| [PGL-023](#pgl-023) | Add Sponsor — XDuce (index + season3 pages) | Feature | P2 | Done |

---

## PGL-001

**Real Backend — Cloudflare KV**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P0 |
| Status | Done |
| Created | 2026-03-16 |
| Completed | 2026-03-24 |

### Description
Replaced localStorage-based result storage with Cloudflare KV, making results shared across all devices in real time. Prerequisite for dual-captain approval flow. Also moved match and team data from hardcoded HTML into KV (Fix 2) so the schedule can be updated without a redeploy.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `2e776a9` | 2026-03-20 | Add personas, login, and Cloudflare KV backend |
| `004b612` | 2026-03-24 | feat: move match/team data from HTML to KV (Fix 2) |
| `6d6ecac` | 2026-03-24 | fix: seed script reads from pre-Fix2 commit hash |
| `f2ae534` | 2026-03-24 | fix: reset filteredMatches after fetchSchedule loads MATCHES from KV |

---

## PGL-002

**Live Leaderboard**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Done |
| Created | 2026-03-16 |
| Completed | 2026-03-16 |

### Description
Real-time scoreboard showing Team D vs Team R running totals. Progress bar towards the 14.5-point winning threshold. Match-by-match breakdown of point accumulation. Visual "clinched" state when a team reaches 14.5.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `c27dcc2` | 2026-03-16 | Initial commit — RTGS PGL Season 3 site |

---

## PGL-003

**Dual-Captain Score Approval**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Done |
| Created | 2026-03-20 |
| Completed | 2026-03-21 |

### Description
Two-captain result approval flow. Captain D enters a result → it shows as Pending. Captain R reviews and either Approves (goes Live) or Disputes (Admin makes final call). Removes dependency on Admin for every result entry. Mirrors real Ryder Cup card-signing.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `7747ac6` | 2026-03-21 | Dual-captain score approval flow (#13) |
| `a4d9a52` | 2026-03-21 | Add profile avatar dropdown and 30-min session timeout |
| `d944e75` | 2026-03-21 | Mark Feature #1 Dual-Captain Score Approval as completed |

---

## PGL-004

**Player Profiles**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Done |
| Created | 2026-03-20 |
| Completed | 2026-03-24 |

### Description
Profile modal for each of the 16 players (click their name in the roster). Shows W/L/H record, points contributed, and a full match history table across all formats. Admin can edit player name and HCP directly in the modal (saved to KV).

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `f0243c2` | 2026-03-24 | feat: add player profile modal with match history and admin edit |
| `9452a85` | 2026-03-24 | docs: mark Player Profiles complete; add Photo Gallery feature idea |

---

## PGL-005

**Photo Gallery**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Done |
| Created | 2026-03-24 |
| Completed | 2026-03-25 |

### Description
Separate `/gallery.html` page linked from the season3 nav. Infinite vertical scroll through match-day photos stored on Cloudflare R2. Fans can Like and Comment on photos. Organiser role can upload photos with a short description (≤140 chars). Admin can also delete photos.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `fbf8040` | 2026-03-24 | docs: lock in Gallery feature decisions (R2, /gallery.html, likes+comments) |
| `e5ea29b` | 2026-03-24 | feat: add photo gallery with R2 storage, likes, comments and organiser upload |
| `e638c8d` | 2026-03-25 | fix: add Gallery badge to home page |
| `fd8ba8c` | 2026-03-25 | fix: move Gallery link to index page header, remove card badge |
| `7186cdc` | 2026-03-25 | fix: gallery nav, dynamic back link, login E2E test fixes |

---

## PGL-006

**Head-to-Head Stats & Season Leaderboard**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Done |
| Created | 2026-03-25 |
| Completed | 2026-03-25 |

### Description
Three stat surfaces computed client-side from existing KV data (no new API needed):
1. **Season Player Leaderboard** — all 16 players ranked by Points, Win%, W/H/L, Best Format. Click name → opens profile modal.
2. **Team H2H by Format** — 4-row table (Four Balls / Scramble / Alternate Shot / Singles) showing D vs R wins per format with a mini visual bar.
3. **Player vs Player record** — new "vs. Opponents" tab in the player profile modal listing every opponent faced (Played / W / H / L).

Also includes a sticky anchor nav strip for section quick-jump.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `b8447c5` | 2026-03-25 | feat: H2H stats, season leaderboard, sticky anchor strip |

---

## PGL-007

**Help Icon & Feedback Modal**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Done |
| Created | 2026-03-24 |
| Completed | 2026-03-24 |

### Description
Persistent help (?) icon on the season3 page. Opens a modal where any user can submit feedback. Admin inbox to review submitted feedback. Feedback stored in KV.

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `e66b73e` | 2026-03-24 | feat: add help icon with feedback modal and admin inbox |

---

## PGL-008

**DZ Handicap Correction (16 → 20)**

| Field | Value |
|-------|-------|
| Type | Data |
| Priority | P0 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
DZ (Team R, R8) was entered with HCP 16 in the initial roster; the correct handicap is 20. Updated in: `templates/pages/season3.page.html`, `public/season3.html`, `CLAUDE.md`, memory store, and KV roster (prod + staging). Fixing this moved DZ into the HCP-20 bracket, making all four singles brackets perfectly even (1v1, 3v3, 3v3, 1v1) and enabling the full singles schedule redesign (PGL-009).

### Commits
_KV-only change — no git commit generated._

---

## PGL-009

**Singles Schedule Redesign (M25–M40)**

| Field | Value |
|-------|-------|
| Type | Data |
| Priority | P0 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
Full redesign of all 16 singles matches (M25–M40) after DZ's HCP correction (PGL-008). With DZ at HCP 20, all four brackets became even: HCP14 1v1, HCP16 3v3, HCP20 3v3, HCP22 1v1. Produced 12 same-bracket matches and 4 cross-bracket matches (2 favour D, 2 favour R — balanced). No player faces the same opponent in both Round 1 (October) and Round 2 (November). All matches paired into foursomes (M25+M26=A, M27+M28=B, etc.). Updated in prod and staging KV.

**Final pairings:**

| Match | Team D | Team R | HCP | Round |
|-------|--------|--------|-----|-------|
| M25 | Anuj Pandey | Shailendra Singh | 14 | Oct |
| M26 | Bala Sankaran | Srikant N | 22 | Oct |
| M27 | Vikrant Patil | John C | 16 | Oct |
| M28 | Raghu Sundaram | Mazz | 20 | Oct |
| M29 | Anirudha | Satyapal P | 16 | Oct |
| M30 | Hemang C | Rushabh L | 20 | Oct |
| M31 | Selva S Sundaram | Rahul R | 16 | Oct |
| M32 | Nimesh Dave | DZ | 20 | Oct |
| M33 | Anuj Pandey | John C | 14v16 | Nov |
| M34 | Nimesh Dave | Rushabh L | 20 | Nov |
| M35 | Vikrant Patil | Shailendra Singh | 16v14 | Nov |
| M36 | Raghu Sundaram | DZ | 20 | Nov |
| M37 | Anirudha | Rahul R | 16 | Nov |
| M38 | Hemang C | Srikant N | 20v22 | Nov |
| M39 | Selva S Sundaram | Satyapal P | 16 | Nov |
| M40 | Bala Sankaran | Mazz | 22v20 | Nov |

### Commits
_KV-only change — no git commit generated._

---

## PGL-010

**M1 / M4 Opponent Swap**

| Field | Value |
|-------|-------|
| Type | Data |
| Priority | P1 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
The Team R pairings in Match 1 and Match 4 were swapped at the organiser's request. After the swap:
- **M1** (Four Balls): Vikrant Patil & Anuj Pandey **vs Shailendra Singh & Satyapal P**
- **M4** (Scramble): Raghu Sundaram & Hemang C **vs John C & DZ**

Updated in prod and staging KV, both environments redeployed.

### Commits
_KV-only change — no git commit generated._

---

## PGL-011

**Playoff Scenarios & Clinching Drama**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Planned |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
A panel on the Season 3 page showing live tension as the season progresses. "Team D needs X more points to clinch" / "Team R can still win if they take all remaining matches." Remaining match breakdown by format. Visual progress bars + "path to victory" summary sentence. Handles the 14.5–14.5 tie scenario with tiebreaker rule. ~14h estimated effort.

### Commits
_Not started._

---

## PGL-012

**Pre-Match Lineup Card**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Auto-generated card when pairings are confirmed. Shows format, course, both pairings side-by-side, combined HCP, and head-to-head record if the players have met before. Shareable link for WhatsApp distribution. "Featured player" spotlight rotates weekly.

### Commits
_Not started._

---

## PGL-013

**Streak Tracker & Weekly Awards**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
"Hot Hand" tracker showing current win streak per player (e.g., "Raghu: 3 in a row"). Auto-calculated weekly awards: Best Scorer, Most Consistent, Best Pairing. Award badges on player profiles. Admin can override or add custom awards.

### Commits
_Not started._

---

## PGL-014

**Match Day Page**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Focused view for the day of play — shows only today's matches. Countdown timer to the next match day. Course info, who's playing, format reminder. Shareable link to send to players before each match day.

### Commits
_Not started._

---

## PGL-015

**Post-Match Replay & Highlights**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Auto-generated match summary when a result is approved. Scoreline with point breakdown, player highlights, key moments (organiser can edit one line). Embeds gallery photos uploaded for that match. Shareable quote card: "Team D edges ahead 2–0 in Match 3."

### Commits
_Not started._

---

## PGL-016

**Notifications / Announcements**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P3 |
| Status | Deferred |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Admin posts short announcements (e.g., "Match 5 postponed to June 15"). All visitors see it as a banner on their next visit. Stored in Cloudflare KV. Deferred — lower ROI relative to social engagement features.

### Commits
_Not started._

---

## PGL-017

**Match Predictions**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P3 |
| Status | Deferred |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Pre-match toggle for all users: predict D Win / Halved / R Win. Prediction accuracy leaderboard across the season. Deferred pending demand validation — risk of fighting WhatsApp inertia without proving engagement first.

### Commits
_Not started._

---

## PGL-018

**Season Archive**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P3 |
| Status | Deferred |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Once Season 3 ends, the page freezes into a read-only archive. A new Season 4 page starts fresh. The index page shows all seasons with their final scores. Deferred — end-of-season task.

### Commits
_Not started._

---

## PGL-019

**SaaS / Multi-League Platform**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P3 |
| Status | Deferred |
| Created | 2026-03-25 |
| Completed | 2026-04-04 |

### Description
Multi-league / multi-season KV namespace routing, customisable team names/colours/logo, flexible match formats, Stripe billing, player self-service invite + registration, white-label/custom domain support. Estimated ~140–180h total effort. **Do not build until 3–5 external paying leagues are confirmed.** Prove willingness to pay via manual onboarding first.

### Commits
_Not started._

---

## PGL-020

**Auth Security Audit — Credentials Compliance**

| Field | Value |
|-------|-------|
| Type | Chore |
| Priority | P1 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
Audit of credential storage to confirm no usernames or passwords are hardcoded in source code, config files, or version-controlled secrets.

**Findings — compliant:**
- Credentials stored in a **Cloudflare Worker Secret** (`AUTH_USERS`), not in source code or `wrangler.jsonc`.
- Format: JSON array of `{ username, passwordHash, role, team, display }` — passwords are SHA-256 hashed before storage.
- At runtime, `src/index.ts` line 128 reads `JSON.parse(env.AUTH_USERS ?? '[]')`. Incoming passwords are hashed before comparison.
- `.dev.vars` contains only `WRITE_KEY=rtgs-kv-w-2026` (non-credential shared secret, not user auth).
- No plaintext passwords found anywhere in the repository.

**Gap noted (not a blocker):** Adding a new user requires Wrangler CLI access. Admin self-service user management is a separate story if needed in future.

### Commits
_Audit only — no code changes made._

---

## PGL-021

**Application Architecture SVG Diagram**

| Field | Value |
|-------|-------|
| Type | Chore |
| Priority | P2 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
Create a detailed SVG architecture diagram for the RTGS PGL application, targeting new developers onboarding to the codebase. The diagram should give a developer a full mental model of the system before touching any code.

**Output:**
- File: `docs/architecture.svg`
- Linked from `README.md` with a short description

**What to show:**

_Services & components:_
- Browser client (HTML/CSS/JS served as static assets)
- Cloudflare Worker (`src/index.ts`) — the single backend entry point
- Cloudflare KV — namespaces: schedule, rosters, results, analytics, gallery metadata, error logs, help inbox
- Cloudflare R2 — gallery image binary storage
- GitHub repository — source of truth, manual deploy trigger

_API endpoints (grouped by domain):_
- Auth: `POST /api/login`
- Schedule: `GET /api/schedule`, `POST /api/schedule`
- Results: `GET /api/results`, `POST /api/results`
- Gallery: `POST /api/gallery/upload`, `GET /api/gallery`, `POST /api/gallery/like`, `POST /api/gallery/comment`, `DELETE /api/gallery/:id`
- Analytics: `GET /api/analytics`, `POST /api/track`
- Ops: `GET /api/log`, `POST /api/log`, `GET /api/help`, `POST /api/help`

_Data flows (labelled arrows):_
- Browser → Worker: HTTP requests with Bearer token or X-Write-Key header
- Worker → KV: reads/writes per endpoint (show which KV key each endpoint touches)
- Worker → R2: image upload (binary) and image serve (stream)
- Worker → Browser: JSON responses and static asset serving
- Developer → GitHub: git push → manual `wrangler deploy` → Worker updated

_Auth layer:_
- Show the two auth paths: Bearer token (HMAC-SHA256, 30-min expiry) and X-Write-Key (server-to-server)
- Show role access boundaries: which roles can reach which endpoint groups

**Style guidance:** Clean dark-background diagram to match the site's navy/gold theme (`#0a1628` background, `#c9a84c` accent lines, white labels). Group related endpoints into swim lanes or bounded boxes.

### Acceptance Criteria
- A new developer can read the diagram and answer: "where does data live?", "how does auth work?", "what does the Worker do?", and "how does a deploy happen?" — without reading any code first.
- All API endpoints documented in `src/index.ts` are represented.
- README updated with a link and one-line description of the diagram.

### Commits
_Not started._

---

## PGL-022

**Team Name Rename — Dhurandhar → Europe, Rushabh → USA**

| Field | Value |
|-------|-------|
| Type | Data |
| Priority | P1 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-04 |

### Description
One-time rename of both team names across the entire codebase. Team colours remain unchanged.

| Old Name | New Name | Colour |
|----------|----------|--------|
| Team Dhurandhar | Team Europe | Steel blue `#4a90c4` |
| Team Rushabh | Team USA | Crimson `#c44a4a` |

**Files to update:**
- `templates/pages/season3.page.html` — display text and JS string references
- `public/season3.html` — built output (same changes)
- `CLAUDE.md` — teams section

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `040435f` | 2026-04-04 | feat: rename teams — Dhurandhar→Europe, Rushabh→USA (PGL-022) |
| `9f769fb` | 2026-04-04 | fix: restore E/U player ID prefix after merge conflict regression (PGL-022) |

---

## PGL-023

**Add Sponsor — XDuce (index + season3 pages)**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Done |
| Created | 2026-04-04 |
| Completed | 2026-04-05 |

### Description
Add XDuce as the official title sponsor across the landing page and season3 page. Hardcoded for now; designed to accommodate additional sponsors in future.

**Sponsor details:**
- Name: XDuce
- Contact: Jay Dave, CEO & Founder
- Website: https://www.xduce.com
- Logo: `pics/sponsors/xduce-logo-1.svg`

**index.html — below the Season 3 badge:**
A "SPONSORED BY [xduce-logo]" line, separate from the Season 3 badge. Logo links to xduce.com (opens in new tab).

```
[ Season 3  |  View Details → ]

SPONSORED BY  [xduce-logo ↗]
```

**season3.html — slim strip directly under the Ryder Cup format banner:**
Borderless, centered row. Logo centre, visit link right.

```
OFFICIAL SPONSOR  [xduce-logo]  Visit xduce.com ↗
```

**Style rules:**
- No border (borderless, blends into hero background)
- Content centered on desktop and mobile (single row on both)
- Logo displayed at 24px height (1.5× the original 16px)
- "Visit xduce.com ↗" — gold accent link, opens in new tab
- No border-radius (matches site sharp-edge convention)
- Mobile: single row, centered

### Acceptance Criteria
- Sponsor strip visible on index.html below the Season 3 badge (not inside it)
- Sponsor strip visible on season3.html directly under the Ryder Cup format section
- Logo renders correctly from `pics/sponsors/xduce-logo-1.svg`
- Logo links to xduce.com in a new tab
- Label reads "Sponsored by" (not "Presented by")
- Logo is 24px tall (1.5× original)
- Mobile layout single row, centered at 375px
- No changes to existing colour scheme or layout elsewhere

### Commits
| SHA | Date | Message |
|-----|------|---------|
| `90e7877` | 2026-04-04 | feat: PGL-023 sponsor badge — new line on landing page, centered + borderless strip on season3 |
| `44f7a22` | 2026-04-05 | fix: PGL-023 sponsor improvements — move outside badge, Sponsored by, logo 1.5x, xduce link |

---

## PGL-024

**Score Update Audit Log**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
Every change to a match result must be recorded in an immutable audit trail. The audit log is displayed inline at the bottom of the match detail modal, visible to Admin and Captains.

**What each audit entry captures:**
| Field | Description |
|-------|-------------|
| `matchId` | Match number (e.g. "Match 3") |
| `action` | `submitted` / `approved` / `disputed` / `admin_override` |
| `prevResult` | Result before the change (null if first submission) |
| `newResult` | Result after the change |
| `username` | Who performed the action |
| `role` | Their role at the time (`admin` / `captain`) |
| `ts` | ISO timestamp |

**Storage:** Append-only array per match, stored in KV under a dedicated key (e.g. `season3_audit_match_3`). Never overwrite — only append.

**Where it appears:** Bottom of the existing match detail modal as a collapsible "Match History" section. Collapsed by default to keep the modal clean; expands on click.

```
┌─────────────────────────────────────────────────────┐
│  Match 3 — Result: Team Europe wins                 │
│  ...existing modal content...                       │
│                                                     │
│  ▶ Match History  (3 events)          [click to expand]
│  ─────────────────────────────────────              │
│  ✓ Approved    vikrant · Captain  · 02 Apr 14:32    │
│  ↺ Disputed    shailendra · Captain · 02 Apr 13:10  │
│  + Submitted   vikrant · Captain  · 02 Apr 12:55    │
└─────────────────────────────────────────────────────┘
```

**Who can see it:**
- Admin — always visible
- Captain — visible on any match (not restricted to their own team's matches)
- Fan / Organiser — hidden

**Backend changes (`src/index.ts`):**
- On every `POST /api/results` action, append an audit entry to the match's audit key in KV
- New `GET /api/audit?match=<id>` endpoint — returns the full audit array for a match; requires Bearer token with role `admin` or `captain`

**Frontend changes (`templates/pages/season3.page.html`):**
- Add "Match History" collapsible section to the match detail modal
- Fetch audit entries from `GET /api/audit?match=<id>` when the modal opens (only if role is admin or captain)
- Render as a timeline list (icon + action label + username/role + timestamp)

### Acceptance Criteria
- Every result submission, approval, dispute, and admin override creates an audit entry
- Entries are append-only — no entry can be deleted or modified
- Match History section visible in the modal for Admin and Captain; hidden for Fan/Organiser
- Section is collapsed by default, expands on click
- Timestamps shown in local time, formatted as `DD MMM HH:mm`
- Works on mobile at 375px

### Commits
_Not started._

---

## PGL-025

**Course Names Popup — "10+ Courses" click on hero strip**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
When a user clicks the "10+ Courses" text in the season3 hero strip (`Ryder Cup Format · 16 Players · 2 Teams · 10+ Courses`), a modal popup opens showing the full list of courses for the season.

**Courses (Season 3):**
1. Ashbrook
2. Galloping Hill
3. Neshanic Valley
4. Spook Brook
5. Quailbrook
6. Royce Brook
7. Fox Hollow
8. Tamarack East
9. Tamarack West
10. Berkshire Valley

**Trigger:** The "10+ Courses" portion of the hero-sub line becomes a clickable element (cursor pointer, subtle gold underline on hover). The rest of the line ("Ryder Cup Format · 16 Players · 2 Teams ·") remains plain text.

**Modal design** (matches site design system):
- Dark navy background `#0a1628`, gold-tinted border `rgba(201,168,76,0.18)`
- Title: "Season 3 Courses" in Playfair Display
- Simple numbered list of course names in Raleway
- Close button (✕) top right
- No border-radius (sharp edges)
- Mobile friendly — full width on 375px

**Implementation:**
- Only `templates/pages/season3.page.html` changes needed
- Reuse existing modal overlay pattern already in the file
- Course list hardcoded in JS (no KV needed)

### Acceptance Criteria
- Clicking "10+ Courses" opens the modal; clicking outside or ✕ closes it
- All 10 course names displayed as a numbered list
- Modal matches the dark navy/gold design system
- Works on mobile at 375px
- "Ryder Cup Format", "16 Players", "2 Teams" portions are NOT clickable

### Commits
_Not started._

---

## PGL-026

**Gallery Audit Log — Upload & Delete Tracking**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P1 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
Extend gallery audit coverage so every upload and delete is permanently recorded. Likes and comments are not audited.

**What is already captured (uploads):**
- `uploadedBy` — username
- `uploadedAt` — ISO timestamp

**What needs adding (deletes — currently zero trace):**
Every `DELETE /api/gallery/:id` must append an audit entry to a dedicated KV key before removing the image from R2 and gallery metadata.

**Audit entry schema (per event):**
| Field | Description |
|-------|-------------|
| `action` | `uploaded` or `deleted` |
| `imageId` | Unique image ID |
| `caption` | Image caption/description at time of event |
| `username` | Who performed the action |
| `role` | Their role (`admin` / `organiser`) |
| `ts` | ISO timestamp |

**Storage:** Append-only array in KV under key `season3_gallery_audit`. Never overwrite — only append.

**Where it appears:** A small clock/history icon (🕐 or similar) on each photo card in the gallery, visible to Admin only. Clicking it opens a compact inline drawer or tooltip showing that image's audit trail (uploaded by X on date, deleted by Y on date if applicable).

**Backend changes (`src/index.ts`):**
- On `POST /api/gallery/upload` — append `uploaded` entry to `season3_gallery_audit`
- On `DELETE /api/gallery/:id` — append `deleted` entry before removing the image
- New `GET /api/gallery/audit?imageId=<id>` endpoint — returns audit entries for a specific image; requires Bearer token with `role === 'admin'`

**Frontend changes (`public/gallery.html` or template):**
- History icon rendered on each photo card only when `SESSION.role === 'admin'`
- On click: fetch `GET /api/gallery/audit?imageId=<id>` and render inline as a compact timeline

### Acceptance Criteria
- Every upload creates an audit entry (backfill not required for existing images)
- Every delete creates an audit entry before the image is removed
- Audit entries are append-only and cannot be deleted
- History icon visible on each photo for Admin only — hidden for all other roles
- Clicking the icon shows that image's audit trail (uploaded by, deleted by if applicable)
- Works on mobile at 375px

### Commits
_Not started._

---

## PGL-027

**Extend Analytics Access to Captains and Organisers**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
Currently `/analytics.html` is Admin-only. Extend full read access to Captains and Organisers — same page, same data, no filtering by role.

**Current access control (two places to update):**

1. **Frontend** — `public/analytics.html` line ~137:
   ```js
   if (SESSION.role !== 'admin') { window.location.replace('/'); }
   ```
   Change to allow `captain` and `organiser` roles too:
   ```js
   if (!['admin','captain','organiser'].includes(SESSION.role)) { window.location.replace('/'); }
   ```

2. **Backend** — `src/index.ts` GET `/api/analytics` handler (lines ~279–282):
   Currently requires `X-Write-Key` OR Bearer token with `role === 'admin'`.
   Update to also accept Bearer tokens with `role === 'captain'` or `role === 'organiser'`.

**No changes to the analytics data displayed** — all roles see the same full dataset (page views, events, persona breakdown, username, country, timestamp).

**Nav link** — if `/analytics.html` is linked from a nav or dashboard menu, ensure the link is visible to captains and organisers too (not just admin).

### Acceptance Criteria
- Captain can navigate to `/analytics.html` and see full analytics data
- Organiser can navigate to `/analytics.html` and see full analytics data
- Fan / unauthenticated users are still redirected away
- Backend `GET /api/analytics` returns data for captain and organiser Bearer tokens
- No changes to the data shown or the page layout

### Commits
_Not started._

---

## PGL-028

**Capture City & ISP in Analytics Events**

| Field | Value |
|-------|-------|
| Type | Feature |
| Priority | P2 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
Enrich each analytics event with the visitor's city and ISP name. All data is available from Cloudflare request metadata — no external API calls needed.

**Data sources (server-side, `src/index.ts` POST `/api/track`):**
| Field | Cloudflare source |
|-------|-------------------|
| `city` | `request.cf.city` |
| `isp` | `request.cf.asOrganization` |

Full IP address is intentionally NOT stored — city + ISP is sufficient for analytics and less sensitive for this private invite-only league.

**Scope:** Analytics events only (`POST /api/track`). Score audit logs (PGL-024) and gallery audit logs (PGL-026) are not affected.

**Backend changes (`src/index.ts`):**
- In the `POST /api/track` handler, read `request.cf?.city` and `request.cf?.asOrganization` server-side and append them to the stored event entry
- These fields are already available on the `request.cf` object in Cloudflare Workers — no client-side changes needed
- Handle gracefully if either field is undefined (store as `null`)

**Frontend changes:** Add City and ISP columns to the event log table in `analytics.html`. For existing events that predate this feature, display `—` in those columns.

**Analytics dashboard (`public/analytics.html`):**
- Add `City` and `ISP` columns to the event log table
- Render `event.city ?? '—'` and `event.isp ?? '—'` for each row
- Old events without these fields show `—` automatically

### Acceptance Criteria
- New analytics events include `city` and `isp` fields
- Both fields are `null` if Cloudflare does not provide them (no errors thrown)
- Existing events without these fields are unaffected (backwards compatible)
- Full IP address is never stored
- Analytics table shows City and ISP columns; old entries display `—`

### Commits
_Not started._

---

## PGL-029

**Custom Domain for Staging — staging.rtgspgl.org**

| Field | Value |
|-------|-------|
| Type | Chore |
| Priority | P2 |
| Status | Planned |
| Created | 2026-04-04 |
| Completed | — |

### Description
`rtgspgl.org` is already registered and pointed to prod in Cloudflare. Add `staging.rtgspgl.org` as the custom domain for the staging Worker environment, replacing the default `rtgs-pgl-staging.selvaraj-s.workers.dev` URL.

**Current state:**
| Environment | URL |
|-------------|-----|
| Production | `rtgspgl.org` (custom domain, already configured) |
| Staging | `rtgs-pgl-staging.selvaraj-s.workers.dev` (workers.dev default) |

**Target state:**
| Environment | URL |
|-------------|-----|
| Production | `rtgspgl.org` |
| Staging | `staging.rtgspgl.org` |

**Steps:**

1. **Cloudflare DNS** — Add a CNAME record in the `rtgspgl.org` zone:
   - Name: `staging`
   - Target: `rtgs-pgl-staging.selvaraj-s.workers.dev`
   - Proxied: Yes (orange cloud)

2. **`wrangler.jsonc`** — Add a `routes` entry to the staging environment block:
   ```jsonc
   "routes": [{ "pattern": "staging.rtgspgl.org/*", "zone_name": "rtgspgl.org" }]
   ```

3. **`CLAUDE.md`** — Update the staging URL reference from `rtgs-pgl-staging.selvaraj-s.workers.dev` to `staging.rtgspgl.org`

4. **E2E test config** — Update any hardcoded staging URLs in test files or scripts

**Note:** The Cloudflare DNS step must be done manually in the Cloudflare dashboard (cannot be done via Wrangler CLI alone). The `wrangler.jsonc` change can be committed and deployed normally.

### Acceptance Criteria
- `https://staging.rtgspgl.org` serves the staging Worker
- `https://rtgspgl.org` continues to serve prod unchanged
- `npx wrangler deploy --env staging` deploys to `staging.rtgspgl.org`
- CLAUDE.md and any test configs updated with the new staging URL

### Commits
_Not started._
