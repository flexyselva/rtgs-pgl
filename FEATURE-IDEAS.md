# RTGS PGL — Feature Ideas

_Brainstormed: 20 March 2026. Reviewed: 25 March 2026 (LIV Golf + CFO lens)_

---

## 1. Dual-Captain Score Approval — COMPLETED

**Flow:**
1. ✅ Captain D plays a match → enters the result (outcome + net score)
2. ✅ Result shows as **"Pending"** — visible to both captains but not published to the scoreboard
3. ✅ Captain R sees the pending result → reviews and either **Approves** or **Disputes**
4. ✅ On approval → result goes **Live** and updates the scoreboard
5. ✅ On dispute → status becomes **"Disputed"** — Admin sees it flagged and makes the final call

**Why this works well:**
- Removes dependency on Admin for every result
- Builds trust — both sides must agree before a result is official
- Mirrors how real Ryder Cup captains would confirm results on the card
- Admin still has override power for edge cases

---

## 2. Player Profiles — COMPLETED

Each of the 16 players gets a profile modal (click their name in the Team Rosters section):
- ✅ Win/Loss/Halve record and points contributed across all matches played
- ✅ Full match history table — all formats, with result indicator and link to match detail
- ✅ Admin can edit player Name and HCP directly in the modal (saved to KV)

---

## 3. Live Leaderboard — COMPLETED

- Real-time scoreboard showing Team D vs Team R running total
- Progress bar showing how close each team is to 14.5 (the winning threshold)
- Match-by-match breakdown of how points were accumulated
- Visual "clinched" moment when a team hits 14.5

---

## 4. Match Day Page

- A focused view for the day of play — shows only today's matches
- Countdown timer to the next match day
- Course info, who's playing, format reminder
- Shareable link to send to players before each match day

---

## 5. Notifications / Announcements

- Admin posts a short announcement (e.g., "Match 5 postponed to June 15")
- All players see it as a banner the next time they visit
- Stored in Cloudflare KV

---

## 6. Head-to-Head Stats — NEXT UP

Three interconnected stat surfaces, all computed client-side from existing data (no new API/KV needed):

**a. Season Player Leaderboard** (new section on `season3.html`)
- Sortable table: all 16 players ranked by Points, Win%, W/H/L, Best Format
- Click any player name → opens their profile modal

**b. Team H2H by Format** (below team clash banner)
- 4-row table: Four Balls / Scramble / Alternate Shot / Singles
- Shows Team D wins vs Team R wins + mini visual bar per format
- Answers "which format does each team dominate?"

**c. Player vs Player record** (new tab inside player profile modal)
- "vs. Opponents" tab alongside existing "Match History" tab
- Lists every opponent faced: Played / W / H / L
- Click an opponent → jumps to their profile

**Why high ROI:**
- Zero new infrastructure — pure JS computation from already-fetched data
- Highly personal ("I'm 3–1 vs Mazz") → drives app check-ins
- Demo-able differentiator vs spreadsheet/WhatsApp tracking
- Technical plan ready — see Plan section below

**Technical plan:**
- One new function `computeAllH2HStats()` called after `fetchResults()` resolves
- Populates three module-level objects: `PLAYER_STATS`, `H2H_PAIRS`, `TEAM_FORMAT_STATS`
- Three render functions: `renderLeaderboard()`, `renderTeamFormatStats()`, `renderPlayerH2H()`
- Only file changed: `templates/pages/season3.page.html`
- Realistic effort: **~12 hours** (compute logic + UI + CSS + testing)

---

## 7. Season Archive

- Once Season 3 ends, the page freezes into a read-only archive
- A new Season 4 page starts fresh
- Index page shows all seasons with their final scores

---

## 8. Real Backend (Cloudflare KV / D1) — COMPLETED

- Currently results live in localStorage — per device, not shared
- Moving to Cloudflare KV or D1 (SQLite) would make results truly shared across all devices
- Captains could enter scores on their phone and everyone sees it immediately
- Required for dual-captain approval flow to work across devices

---

## 9. Photo Gallery — COMPLETED

A scrollable gallery of match-day photos, accessible from the main navigation. Players and fans can browse pictures with a short caption alongside each photo.

**User flows:**
- **All visitors (fan/captain):** Browse the gallery — infinite vertical scroll through uploaded photos, each showing the image, a one-liner description, and the match/date it belongs to
- **Organiser login (new `organiser` role):** Can upload photos with a short description (max ~140 chars). Upload UI is only visible when logged in as organiser. No match editing rights — photo upload only.
- **Admin:** Can also upload, and additionally delete any photo

**Decisions (2026-03-24):**
1. ✅ Separate `/gallery.html` page (linked from season3 nav)
2. ✅ Cloudflare R2 for image storage (native to the stack)
3. ✅ Fans can Like and Comment on photos

---

## 10. Playoff Scenarios & Clinching Drama

_CFO-validated: High ROI, ~14h realistic effort_

A panel on the Season 3 page showing live tension as the season progresses:
- "Team D needs X more points to clinch"
- "Team R needs Y more — can still win if they take all remaining matches"
- Remaining match breakdown: how many Four Balls, Scrambles, etc. still to play
- If 14.5–14.5 tie is possible, show tiebreaker rule clearly
- Visual: progress bars + "path to victory" summary sentence

**Why:** The emotional peak of the product — the moment an admin most wants to show a prospective new customer. Makes the endgame feel like LIV Golf's final day.

---

## 11. Pre-Match Lineup Card & Player Spotlights

_Social glue — drives engagement 48h before each match_

- Auto-generated card when pairings are confirmed in the schedule
- Shows: format, course, both pairings side-by-side, combined HCP, head-to-head record if they've met before
- Shareable link (easy copy for WhatsApp)
- "Featured player" spotlight rotates weekly — click to see their profile stats

---

## 12. Post-Match Replay & Highlights

_Social glue — drives engagement after result confirmed_

- Auto-generated match summary when result is approved
- Scoreline with point breakdown, player highlights, key moments (organiser can edit one line)
- Embeds gallery photos uploaded for that match
- Shareable quote card: "Team D edges ahead 2–0 in Match 3"

---

## 13. Streak Tracker & Weekly Awards

_Social glue — drives daily return visits_

- "Hot Hand" tracker: shows current win streak per player (e.g., "Raghu: 3 in a row")
- Weekly auto-calculated awards: Best Scorer, Most Consistent, Best Pairing
- Award badges appear on player profiles
- Admin can override/add custom awards
- Players notified when they earn an award

---

## 14. Match Predictions

_Community engagement feature — deferred (fighting WhatsApp inertia)_

- Pre-match toggle: "Predict the outcome: D Win / Halved / R Win"
- Prediction accuracy leaderboard across the season
- Incentive: bragging rights or first pick of next season's team
- Requires behaviour change away from WhatsApp — validate demand before building

---

## 15. SaaS / Multi-League Platform

_Commercial opportunity — build only after 3–5 external paying leagues confirmed_

CFO-validated path: do NOT build speculatively. Prove willingness to pay first (manual onboarding), then automate.

**What's needed for SaaS:**
- Multi-league / multi-season KV namespace routing (24–32h)
- Customisable team names, colours, logo (8–12h)
- Flexible match formats beyond Ryder Cup (16–20h)
- Stripe billing integration (20–24h)
- Player self-service invite + registration (12–16h)
- White-label / custom domain support (8–12h)
- **Total: ~140–180h realistic**

**Market (CFO-revised):**
- UK: 2,500–5,000 golf societies, corporate leagues, club championships
- Realistic price: £450–550/season per league
- Year 1 target: 10–15 paying leagues = £5–7K revenue
- Break-even on SaaS build: ~25 leagues with zero churn
- **Do not start SaaS build until you have 3–5 paid commitments**

---

## Priority Recommendation (Updated 25 March 2026)

| Priority | Feature | Status | Why |
|----------|---------|--------|-----|
| 1 | **Dual-captain score approval** | ✅ Done | Removes admin bottleneck |
| 2 | **Real backend (Cloudflare KV)** | ✅ Done | Prerequisite for #1 |
| 3 | **Live leaderboard** | ✅ Done | Most engaging for all 16 players |
| 4 | **Player profiles** | ✅ Done | Personal investment |
| 5 | **Photo gallery** | ✅ Done | Social glue |
| 6 | **Head-to-Head Stats** | 🔜 Next | High ROI, no new infra, demo differentiator |
| 7 | **Playoff scenarios** | Planned | Emotional peak, ~14h |
| 8 | **Pre-match lineup card** | Planned | Social glue, drives pre-match engagement |
| 9 | **Streak tracker & awards** | Planned | Daily return visits |
| 10 | **Match Day Page** | Planned | Practical utility on day of play |
| 11 | **Post-match replay** | Planned | Social glue, post-match engagement |
| 12 | **Notifications / Announcements** | Deferred | Admin-controlled banners |
| 13 | **Match Predictions** | Deferred | Needs demand validation first |
| 14 | **Season Archive** | Deferred | End-of-season task |
| 15 | **SaaS / Multi-League** | Deferred | Only after 3–5 paid external leagues confirmed |
