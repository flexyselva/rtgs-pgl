# RTGS Premier Golf League

A static website for the **RTGS Premier Golf League (RTGS PGL)** — a private golf league running a Ryder Cup-style team competition since 2020.

**Live site:** https://rtgs-pgl.selvaraj-s.workers.dev

---

## Season 3 — 2026

16 players split into two teams competing across 10+ courses in 40 individual matches.

| Team | Players | Colour |
|------|---------|--------|
| Team Dhurandhar | Vikrant Patil, Anuj Pandey, Anirudha, Selva S Sundaram, Raghu Sundaram, Hemang C, Nimesh Dave, Bala Sankaran | Steel Blue |
| Team Rushabh | Shailendra Singh, Satyapal P, John C, Rahul R, Mazz, Rushabh L, Srikant N, DZ | Crimson |

### Match Formats
| # | Format | Description |
|---|--------|-------------|
| 1 | Four Balls | Best ball — lower score of the pair counts |
| 2 | Scramble | Texas scramble — choose best shot each time |
| 3 | Alternate Shot | Foursomes — partners share one ball |
| 4 | Singles | 1v1 match play — the decisive finale |

### Points
- Win → 1 pt · Halve → 0.5 pt each · Loss → 0 pt
- First team to **20.5 points** wins the Season 3 title

---

## Tech Stack

- **Hosting:** Cloudflare Workers (static assets)
- **Stack:** Plain HTML + CSS — no frameworks, no build step
- **Assets:** `./public` directory

## Development

```bash
# Install dependencies
npm install

# Local dev server (http://127.0.0.1:8787)
npx wrangler dev

# Deploy to Cloudflare
npx wrangler deploy
```

## Project Structure

```
public/
  index.html      # Landing page
  season3.html    # Season 3 — rosters, match schedule, results
wrangler.jsonc    # Cloudflare Workers config
```
