/**
 * POST /api/track
 *
 * Telemetría anónima — recibe { event, data, ts } via sendBeacon o fetch.
 * No persiste nada por defecto: sólo emite a stdout para que Vercel Logs los recoja.
 * Si se conecta luego a un store (KV, Postgres, Tinybird, etc.), basta con extender
 * la función `record()` sin tocar el cliente.
 *
 * Reglas:
 *  - Sin PII ni IP en el payload almacenado (Vercel ya hace logging del request).
 *  - Validación estricta: rechazo de payloads grandes o estructurados raros.
 *  - CORS: same-origin only (el cliente envía desde el mismo dominio).
 *  - Rate limit suave por IP (in-memory; mejor usar Vercel KV en producción).
 */

export const config = {
  runtime: 'nodejs',
};

const ALLOWED_EVENTS = new Set(['ready', 'scene', 'vital', 'audio', 'restart']);
const MAX_BYTES = 2048;

// Naive in-memory rate limit (per cold-start). Bueno para evitar abuso ocasional.
// Para abuso real, usar Vercel KV o Edge Config.
const buckets = new Map();
const RL_WINDOW_MS = 10_000;
const RL_MAX = 60;

function rateLimit(key) {
  const now = Date.now();
  const bucket = buckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > RL_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= RL_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST' } });
  }

  // Same-origin enforcement (avoid trivial cross-origin posts).
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin) {
    try {
      const ok = new URL(origin).host === host;
      if (!ok) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cross-origin not allowed' } });
    } catch {
      return res.status(400).json({ error: { code: 'BAD_ORIGIN' } });
    }
  }

  // Rate limit by forwarded-for IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Slow down' } });
  }

  // Read body (sendBeacon may send Blob; Node parses JSON automatically when content-type is set,
  // but we handle both cases defensively).
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: { code: 'INVALID_BODY' } });
  }

  // Size sanity check (raw)
  const approxBytes = JSON.stringify(body).length;
  if (approxBytes > MAX_BYTES) {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  }

  // Schema validation
  const { event, data, ts } = body;
  if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: { code: 'UNKNOWN_EVENT', fields: { event: 'invalid' } } });
  }
  if (data !== undefined && (typeof data !== 'object' || data === null)) {
    return res.status(400).json({ error: { code: 'INVALID_DATA' } });
  }
  if (ts !== undefined && (typeof ts !== 'number' || ts <= 0)) {
    return res.status(400).json({ error: { code: 'INVALID_TS' } });
  }

  // Record (stdout → Vercel Logs). No PII.
  await record({
    event,
    data: data || {},
    ts: ts || Date.now(),
    region: process.env.VERCEL_REGION || 'local',
    ua: (req.headers['user-agent'] || '').slice(0, 120),
  });

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(204).end();
}

async function record(entry) {
  // Replace this with KV/Postgres/Tinybird as needed.
  console.log('[track]', JSON.stringify(entry));
}
