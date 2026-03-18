// Roster optimizer — maximize minimum unique meetings across all 16 players

const D = ['Vikrant','Anuj','Anirudha','Selva','Raghu','Hemang','Nimesh','Bala'];
const R = ['Shailendra','Satyapal','John','Rahul','Mazz','Rushabh','Srikant','DZ'];
const ALL = [...D, ...R];

// Generate all 7 rounds of round-robin pairs for 8 players (each pair meets exactly once)
function roundRobin(players) {
  const arr = players.slice(1);
  const rounds = [];
  for (let r = 0; r < 7; r++) {
    const pairs = [[players[0], arr[0]]];
    for (let i = 1; i < 4; i++) pairs.push([arr[i], arr[7 - i]]);
    rounds.push(pairs);
    arr.unshift(arr.pop()); // rotate
  }
  return rounds;
}

const D_ROUNDS = roundRobin(D); // 7 valid D-pair partitions
const R_ROUNDS = roundRobin(R); // 7 valid R-pair partitions

// Score: for each player count unique others met; return minimum across all players
function score(foursomes) {
  const met = {};
  ALL.forEach(p => met[p] = new Set());
  foursomes.forEach(f => {
    f.forEach((p, i) => f.forEach((q, j) => { if (i !== j) met[p].add(q); }));
  });
  const counts = ALL.map(p => met[p].size);
  return {
    min:   Math.min(...counts),
    avg:   +(counts.reduce((a,b)=>a+b,0)/16).toFixed(1),
    perPlayer: Object.fromEntries(ALL.map(p => [p, met[p].size]))
  };
}

// Build foursomes from team sessions
// teamSessions: array of 6 sessions, each session = [{dPair, rPair}]
// assignment: how to permute the 4 D-pairs onto the 4 R-pairs (array of 4 indices)
function teamFoursomes(dRoundIdx, rRoundIdx, assignments) {
  const foursomes = [];
  for (let s = 0; s < 6; s++) {
    const dPairs = D_ROUNDS[dRoundIdx[s]];
    const rPairs = R_ROUNDS[rRoundIdx[s]];
    const asgn   = assignments[s];
    for (let i = 0; i < 4; i++) {
      foursomes.push([...dPairs[i], ...rPairs[asgn[i]]]);
    }
  }
  return foursomes;
}

// Build foursomes from a singles session
// singles: 8 [D, R] pairs in order — consecutive pairs share a foursome
function singlesFoursomes(singles) {
  const foursomes = [];
  for (let i = 0; i < 8; i += 2) {
    foursomes.push([singles[i][0], singles[i+1][0], singles[i][1], singles[i+1][1]]);
  }
  return foursomes;
}

// ---------- Define 10 candidate schedules ----------

// Assignment permutations (how D-pairs map to R-pairs each session)
const P0 = [0,1,2,3];
const P1 = [1,2,3,0];
const P2 = [2,3,0,1];
const P3 = [3,0,1,2];
const P4 = [0,2,1,3];
const P5 = [1,3,0,2];
const P6 = [3,2,1,0];

// Singles Oct/Nov — 10 different pairings
// Oct Round 1 pairings (D_i vs R_j)
const OCT_A = [[D[0],R[0]],[D[1],R[1]],[D[2],R[2]],[D[3],R[3]],[D[4],R[4]],[D[5],R[5]],[D[6],R[6]],[D[7],R[7]]];
const OCT_B = [[D[0],R[1]],[D[1],R[2]],[D[2],R[3]],[D[3],R[4]],[D[4],R[5]],[D[5],R[6]],[D[6],R[7]],[D[7],R[0]]];
const OCT_C = [[D[0],R[2]],[D[1],R[3]],[D[2],R[4]],[D[3],R[5]],[D[4],R[6]],[D[5],R[7]],[D[6],R[0]],[D[7],R[1]]];
const OCT_D = [[D[0],R[3]],[D[1],R[4]],[D[2],R[5]],[D[3],R[6]],[D[4],R[7]],[D[5],R[0]],[D[6],R[1]],[D[7],R[2]]];

const NOV_A = [[D[0],R[4]],[D[1],R[5]],[D[2],R[6]],[D[3],R[7]],[D[4],R[0]],[D[5],R[1]],[D[6],R[2]],[D[7],R[3]]];
const NOV_B = [[D[0],R[5]],[D[1],R[6]],[D[2],R[7]],[D[3],R[0]],[D[4],R[1]],[D[5],R[2]],[D[6],R[3]],[D[7],R[4]]];
const NOV_C = [[D[0],R[6]],[D[1],R[7]],[D[2],R[0]],[D[3],R[1]],[D[4],R[2]],[D[5],R[3]],[D[6],R[4]],[D[7],R[5]]];
const NOV_D = [[D[0],R[7]],[D[1],R[0]],[D[2],R[1]],[D[3],R[2]],[D[4],R[3]],[D[5],R[4]],[D[6],R[5]],[D[7],R[6]]];

// Foursome grouping variants for singles (which pairs share a group)
// Grouping A: pairs 0+1, 2+3, 4+5, 6+7 (as-is)
const GRP_A = s => s;
// Grouping B: pairs 0+4, 1+5, 2+6, 3+7 (interleaved)
const GRP_B = s => [s[0],s[4],s[1],s[5],s[2],s[6],s[3],s[7]];
// Grouping C: pairs 0+2, 1+3, 4+6, 5+7
const GRP_C = s => [s[0],s[2],s[1],s[3],s[4],s[6],s[5],s[7]];
// Grouping D: pairs 0+6, 1+7, 2+4, 3+5
const GRP_D = s => [s[0],s[6],s[1],s[7],s[2],s[4],s[3],s[5]];

const candidates = [
  {
    name: 'C1',
    dRounds:  [0,1,2,3,4,5],
    rRounds:  [0,1,2,3,4,5],
    assigns:  [P0,P1,P2,P3,P0,P1],
    oct: GRP_A(OCT_A), nov: GRP_A(NOV_A)
  },
  {
    name: 'C2',
    dRounds:  [0,1,2,3,4,5],
    rRounds:  [1,2,3,4,5,6],
    assigns:  [P1,P2,P3,P0,P1,P2],
    oct: GRP_B(OCT_B), nov: GRP_B(NOV_B)
  },
  {
    name: 'C3',
    dRounds:  [0,2,4,1,3,5],
    rRounds:  [0,3,6,1,4,2],
    assigns:  [P2,P3,P0,P1,P2,P3],
    oct: GRP_C(OCT_C), nov: GRP_C(NOV_C)
  },
  {
    name: 'C4',
    dRounds:  [0,1,2,3,4,5],
    rRounds:  [2,4,6,0,3,5],
    assigns:  [P4,P5,P4,P5,P4,P5],
    oct: GRP_D(OCT_D), nov: GRP_D(NOV_D)
  },
  {
    name: 'C5',
    dRounds:  [0,2,4,6,1,3],
    rRounds:  [1,3,5,0,2,4],
    assigns:  [P0,P2,P4,P6,P1,P3],
    oct: GRP_A(OCT_B), nov: GRP_B(NOV_C)
  },
  {
    name: 'C6',
    dRounds:  [0,3,6,2,5,1],
    rRounds:  [0,4,1,5,2,6],
    assigns:  [P1,P3,P5,P0,P2,P4],
    oct: GRP_C(OCT_D), nov: GRP_D(NOV_A)
  },
  {
    name: 'C7',
    dRounds:  [0,1,3,5,2,4],
    rRounds:  [2,5,1,4,0,3],
    assigns:  [P6,P0,P3,P6,P1,P4],
    oct: GRP_B(OCT_A), nov: GRP_A(NOV_D)
  },
  {
    name: 'C8',
    dRounds:  [0,4,1,5,2,6],
    rRounds:  [3,0,4,1,5,2],
    assigns:  [P3,P6,P2,P5,P1,P4],
    oct: GRP_D(OCT_C), nov: GRP_C(NOV_B)
  },
  {
    name: 'C9',
    dRounds:  [0,5,3,1,6,4],
    rRounds:  [1,6,4,2,0,5],
    assigns:  [P0,P4,P2,P6,P3,P5],
    oct: GRP_A(OCT_C), nov: GRP_C(NOV_A)
  },
  {
    name: 'C10',
    dRounds:  [0,2,5,1,4,6],
    rRounds:  [3,6,0,4,1,5],
    assigns:  [P2,P5,P1,P4,P0,P3],
    oct: GRP_B(OCT_D), nov: GRP_D(NOV_B)
  },
];

// ---------- Evaluate ----------
let best = null;

console.log('\n=== ROSTER OPTIMIZER — Maximize Minimum Unique Meetings ===\n');
console.log(('Comb').padEnd(5), ('Min').padEnd(5), ('Avg').padEnd(6), 'Per player (all 16)');
console.log('-'.repeat(100));

candidates.forEach(c => {
  const team   = teamFoursomes(c.dRounds, c.rRounds, c.assigns);
  const singles = [...singlesFoursomes(c.oct), ...singlesFoursomes(c.nov)];
  const all    = [...team, ...singles];
  const s      = score(all);

  const row = ALL.map(p => `${p.substring(0,4)}:${s.perPlayer[p]}`).join(' ');
  console.log(c.name.padEnd(5), String(s.min).padEnd(5), String(s.avg).padEnd(6), row);

  if (!best || s.min > best.min || (s.min === best.min && s.avg > best.avg)) {
    best = { ...s, name: c.name, foursomes: all, candidate: c };
  }
});

console.log('\n' + '='.repeat(100));
console.log(`\nWINNER: ${best.name}  |  Min unique meetings: ${best.min}  |  Avg: ${best.avg}`);
console.log('\nPer-player breakdown:');
ALL.forEach(p => console.log(`  ${p.padEnd(18)} ${best.perPlayer[p]} unique players met`));

// Print the winning schedule in detail
console.log('\n\n=== WINNING SCHEDULE DETAIL ===\n');
const c = best.candidate;
const months = ['Apr','May','Jun','Jul','Aug','Sep'];
const formats = ['Four Balls','Scramble','Alternate Shot','Four Balls','Scramble','Alternate Shot'];
let matchNum = 1;

for (let s = 0; s < 6; s++) {
  console.log(`--- ${months[s]} 2026 — ${formats[s]} ---`);
  const dPairs = D_ROUNDS[c.dRounds[s]];
  const rPairs = R_ROUNDS[c.rRounds[s]];
  for (let i = 0; i < 4; i++) {
    const dp = dPairs[i];
    const rp = rPairs[c.assigns[s][i]];
    console.log(`  Match ${String(matchNum).padStart(2,'0')}: ${dp[0]} & ${dp[1]}  vs  ${rp[0]} & ${rp[1]}`);
    matchNum++;
  }
}

console.log(`\n--- Oct 2026 — Singles Round 1 ---`);
for (let i = 0; i < 8; i += 2) {
  const g = c.oct;
  console.log(`  Match ${String(matchNum).padStart(2,'0')}: [${g[i][0]} vs ${g[i][1]}]  +  [${g[i+1][0]} vs ${g[i+1][1]}]  (same group)`);
  matchNum++;
  matchNum++;
}

console.log(`\n--- Nov 2026 — Singles Round 2 ---`);
for (let i = 0; i < 8; i += 2) {
  const g = c.nov;
  console.log(`  Match ${String(matchNum).padStart(2,'0')}: [${g[i][0]} vs ${g[i][1]}]  +  [${g[i+1][0]} vs ${g[i+1][1]}]  (same group)`);
  matchNum++;
  matchNum++;
}
