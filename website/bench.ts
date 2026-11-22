// Speed budgets for the panel's data endpoints. Run against a live panel:
//   PANEL_USER=... PANEL_PASSWORD=... bun run panel:bench      (PANEL_URL defaults to http://127.0.0.1:3000)
// It signs in, asks for each endpoint the way a browser does (Brotli), and fails when a payload or a warm answer
// goes over its budget. Credentials come from the environment and are never stored.
const base = process.env.PANEL_URL ?? 'http://127.0.0.1:3000';
const user = process.env.PANEL_USER;
const password = process.env.PANEL_PASSWORD;
if (!user || !password) {
  console.error('Set PANEL_USER and PANEL_PASSWORD.');
  process.exit(2);
}

const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: user, password }),
});
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];
if (!login.ok || !cookie) {
  console.error('Sign-in failed.');
  process.exit(2);
}

const now = Date.now();
const day = 86_400_000;
// Budgets: transferred bytes (Brotli) and the best of three warm answers in ms.
const budgets = [
  { name: 'stats', path: '/api/bot/stats', bytes: 1_000, warmMs: 25 },
  { name: 'players', path: '/api/panel/data/users', bytes: 80_000, warmMs: 25 },
  {
    name: 'growth',
    path: `/api/panel/data/growth?t0=${now - 90 * day}&t1=${now - 60 * day}&t2=${now - 30 * day}&t3=${now + day}`,
    bytes: 1_000,
    warmMs: 25,
  },
  { name: 'catches, page 1', path: '/api/panel/data/instances?limit=10&offset=0', bytes: 6_000, warmMs: 25 },
  { name: 'catches, search', path: '/api/panel/data/instances?limit=10&q=malta', bytes: 6_000, warmMs: 25 },
  { name: 'catalog', path: '/api/bot/collectibles', bytes: 40_000, warmMs: 40 },
];

async function hit(path: string): Promise<{ ms: number; bytes: number; status: number; timing: string }> {
  const started = performance.now();
  const res = await fetch(`${base}${path}`, { headers: { cookie, 'accept-encoding': 'br' } });
  const decoded = (await res.arrayBuffer()).byteLength;
  const bytes = Number(res.headers.get('content-length')) || decoded; // what crossed the wire; fetch decodes the body for us
  return { ms: performance.now() - started, bytes, status: res.status, timing: res.headers.get('server-timing') ?? '' };
}

let failed = 0;
console.log('endpoint'.padEnd(18), 'status', 'bytes'.padStart(9), 'first'.padStart(9), 'warm'.padStart(8), ' result');
for (const b of budgets) {
  const first = await hit(b.path);
  const warm = Math.min(...(await Promise.all([hit(b.path), hit(b.path), hit(b.path)])).map((r) => r.ms));
  const problems = [
    first.status !== 200 && `status ${first.status}`,
    first.bytes > b.bytes && `bytes over ${b.bytes}`,
    warm > b.warmMs && `warm over ${b.warmMs} ms`,
  ].filter(Boolean);
  if (problems.length) failed++;
  console.log(
    b.name.padEnd(18),
    String(first.status).padStart(6),
    String(first.bytes).padStart(9),
    `${first.ms.toFixed(0)} ms`.padStart(9),
    `${warm.toFixed(0)} ms`.padStart(8),
    ' ',
    problems.length ? `FAIL: ${problems.join(', ')}` : 'ok',
    first.timing ? `  [${first.timing}]` : '',
  );
}
process.exit(failed ? 1 : 0);
