/**
 * GET /api/health
 *
 * Health check para monitoring externo (Pingdom, Uptime Kuma, etc.) y CI smoke tests.
 * Siempre responde 200 con metadatos del runtime y el commit (si está disponible).
 *
 * Vercel Function (Node.js runtime, sin dependencias).
 */

export const config = {
  runtime: 'nodejs',
};

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET' } });
  }

  const body = {
    ok: true,
    service: 'e36-scroll-cine',
    timestamp: new Date().toISOString(),
    runtime: process.version,
    region: process.env.VERCEL_REGION || 'local',
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
  };

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json(body);
}
