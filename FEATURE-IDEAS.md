# RTGS PGL — Feature Ideas

_Brainstormed: 20 March 2026_

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
- Stored in localStorage or a Cloudflare KV store

---

## 6. Head-to-Head History

- Dedicated section showing every pairing that has played together or against each other
- "These two have met twice — D leads 1.5 to 0.5"
- Useful for singles selection strategy

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

## 9. Photo Gallery

A scrollable gallery of match-day photos, accessible from the main navigation. Players and fans can browse pictures with a short caption alongside each photo.

**User flows:**
- **All visitors (fan/captain):** Browse the gallery — infinite vertical scroll through uploaded photos, each showing the image, a one-liner description, and the match/date it belongs to
- **Organiser login (new `organiser` role):** Can upload photos with a short description (max ~140 chars). Upload UI is only visible when logged in as organiser. No match editing rights — photo upload only.
- **Admin:** Can also upload, and additionally delete any photo

**Technical considerations:**
- Photos can't be stored in Cloudflare KV (binary size limits) — needs Cloudflare R2 (object storage) or a third-party image host (e.g. Cloudinary free tier)
- Metadata (description, uploader, date, match reference) stored in KV as a JSON list — key `season3_gallery`
- New API endpoints: `POST /api/gallery` (upload metadata + trigger R2 put), `GET /api/gallery` (public, returns list)
- New `organiser` role in AUTH_USERS worker secret — same auth pattern as captain/admin
- Gallery page can be a new route `/gallery.html` or a modal/section within `season3.html`
- Scrolling: simple CSS column/masonry layout, no JS library needed
- Mobile: single-column scroll; desktop: 2–3 column grid

**Decisions (2026-03-24):**
1. ✅ Separate `/gallery.html` page (linked from season3 nav)
2. ✅ Cloudflare R2 for image storage (native to the stack)
3. ✅ Fans can Like and Comment on photos

---

## Priority Recommendation

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | **Dual-captain score approval** ✅ | Removes the admin bottleneck; both captains own the results |
| 2 | **Real backend (Cloudflare KV/D1)** ✅ | Makes results shared across all devices — prerequisite for #1 |
| 3 | **Live leaderboard with progress bar** ✅ | Most engaging feature for all 16 players |
| 4 | **Player profiles** ✅ | Personal investment — everyone wants to see their own stats |
| 5 | **Photo gallery** | Social glue — brings the season to life with match-day memories |
| 6 | **Match day page** | Practical utility on the day of play |
