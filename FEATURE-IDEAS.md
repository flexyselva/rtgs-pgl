# RTGS PGL — Feature Ideas

_Brainstormed: 20 March 2026_

---

## 1. Dual-Captain Score Approval

**Flow:**
1. Captain D plays a match → enters the result (outcome + net score)
2. Result shows as **"Pending"** — visible to both captains but not published to the scoreboard
3. Captain R sees the pending result → reviews and either **Approves** or **Disputes**
4. On approval → result goes **Live** and updates the scoreboard
5. On dispute → status becomes **"Disputed"** — Admin sees it flagged and makes the final call

**Why this works well:**
- Removes dependency on Admin for every result
- Builds trust — both sides must agree before a result is official
- Mirrors how real Ryder Cup captains would confirm results on the card
- Admin still has override power for edge cases

---

## 2. Player Profiles

Each of the 16 players gets a profile page showing:
- Win/Loss/Halve record across all matches played
- Formats they've played (Four Balls, Scramble, Alternate Shot, Singles)
- Partners they've played with
- Head-to-head record against opponents
- Season 3 contribution to team points

---

## 3. Live Leaderboard

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

## 8. Real Backend (Cloudflare KV / D1)

- Currently results live in localStorage — per device, not shared
- Moving to Cloudflare KV or D1 (SQLite) would make results truly shared across all devices
- Captains could enter scores on their phone and everyone sees it immediately
- Required for dual-captain approval flow to work across devices

---

## Priority Recommendation

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | **Dual-captain score approval** | Removes the admin bottleneck; both captains own the results |
| 2 | **Real backend (Cloudflare KV/D1)** | Makes results shared across all devices — prerequisite for #1 |
| 3 | **Live leaderboard with progress bar** | Most engaging feature for all 16 players |
| 4 | **Player profiles** | Personal investment — everyone wants to see their own stats |
| 5 | **Match day page** | Practical utility on the day of play |
