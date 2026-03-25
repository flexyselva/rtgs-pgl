#!/usr/bin/env node
/**
 * seed-schedule.js
 *
 * Extracts MATCHES, TEAM_D_PLAYERS, and TEAM_R_PLAYERS from
 * templates/pages/season3.page.html, then POSTs them to both
 * prod and staging /api/schedule endpoints.
 *
 * Usage:
 *   node scripts/seed-schedule.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────

const WRITE_KEY = 'rtgs-kv-w-2026';

const ENDPOINTS = [
  { name: 'prod',    url: 'https://rtgs-pgl.selvaraj-s.workers.dev/api/schedule' },
  { name: 'staging', url: 'https://rtgs-pgl-staging.selvaraj-s.workers.dev/api/schedule' },
];

// ── Read source file ──────────────────────────────────────────────────────────

// Read from git main branch (the original static data) since the template
// now uses dynamic KV loading and no longer contains the hardcoded arrays.
const { execSync } = require('child_process');
let html;
try {
  html = execSync('git show main:templates/pages/season3.page.html', { cwd: path.join(__dirname, '..') }).toString();
} catch(e) {
  // Fallback: try reading the current file (in case branch hasn't diverged yet)
  const htmlPath = path.join(__dirname, '..', 'templates', 'pages', 'season3.page.html');
  html = fs.readFileSync(htmlPath, 'utf8');
}

// ── Extract MATCHES array ─────────────────────────────────────────────────────

function extractJsArray(source, varName) {
  // Match `const VARNAME = [` and capture everything up to the matching `];`
  const startMarker = `const ${varName} = [`;
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`Could not find "${startMarker}" in source`);

  const arrayStart = startIdx + startMarker.length - 1; // position of `[`
  let depth = 0;
  let i = arrayStart;
  while (i < source.length) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  if (depth !== 0) throw new Error(`Could not find closing ] for ${varName}`);
  const arrayStr = source.slice(arrayStart, i + 1);

  // Use Function constructor to safely evaluate the array literal
  // (avoids full eval scope exposure)
  try {
    // eslint-disable-next-line no-new-func
    const result = (new Function('return ' + arrayStr))();
    return result;
  } catch(e) {
    throw new Error(`Failed to parse ${varName}: ${e.message}`);
  }
}

console.log('Extracting match data from templates/pages/season3.page.html…');

let MATCHES, TEAM_D_PLAYERS, TEAM_R_PLAYERS;
try {
  MATCHES         = extractJsArray(html, 'MATCHES');
  TEAM_D_PLAYERS  = extractJsArray(html, 'TEAM_D_PLAYERS');
  TEAM_R_PLAYERS  = extractJsArray(html, 'TEAM_R_PLAYERS');
} catch(e) {
  console.error('Extraction failed:', e.message);
  process.exit(1);
}

console.log(`  Matches:        ${MATCHES.length}`);
console.log(`  Team D players: ${TEAM_D_PLAYERS.length}`);
console.log(`  Team R players: ${TEAM_R_PLAYERS.length}`);

// ── Strip `points` field from schedule (it lives in results, not schedule) ──

const scheduleMatches = MATCHES.map(m => {
  const { points, ...rest } = m; // eslint-disable-line no-unused-vars
  return rest;
});

// ── Build payload ─────────────────────────────────────────────────────────────

const payload = JSON.stringify({
  matches: scheduleMatches,
  rosters: { teamD: TEAM_D_PLAYERS, teamR: TEAM_R_PLAYERS },
});

// ── POST helper ───────────────────────────────────────────────────────────────

function post(url, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port:     443,
      path:     parsedUrl.pathname,
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Write-Key':   WRITE_KEY,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Seed each endpoint ────────────────────────────────────────────────────────

async function seed() {
  let allOk = true;
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Seeding ${endpoint.name} (${endpoint.url})… `);
    try {
      const result = await post(endpoint.url, payload);
      if (result.status === 200) {
        const parsed = JSON.parse(result.body);
        if (parsed.ok) {
          console.log('OK');
        } else {
          console.log(`UNEXPECTED RESPONSE: ${result.body}`);
          allOk = false;
        }
      } else {
        console.log(`FAILED (HTTP ${result.status}): ${result.body}`);
        allOk = false;
      }
    } catch(e) {
      console.log(`ERROR: ${e.message}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\nAll endpoints seeded successfully.');
  } else {
    console.error('\nOne or more endpoints failed — check output above.');
    process.exit(1);
  }
}

seed();
