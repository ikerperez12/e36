import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const deniedTracked = [
  /^docs\/iker-webdeploy\//,
  /^\.claude\//,
  /^\.codex\//,
  /^\.agents\//,
  /^\.playwright-mcp\//,
  /^\.vercel\//,
  /^\.env(?:\.|$)/
];

const contentRules = [
  { name: 'Windows local path', pattern: /[A-Z]:\\(?:Users|PROYECTOS|projects|dev)\\/i },
  { name: 'Unix local user path', pattern: /\/Users\/|\/home\/[^/\s]+/i },
  { name: 'Local username', pattern: /\bijpg1\b/i },
  { name: 'Agent/private directory', pattern: /\.(?:claude|codex|agents|playwright-mcp|vercel)\//i },
  { name: 'Internal docs path', pattern: /docs\/iker-webdeploy/i },
  { name: 'Common secret token', pattern: /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|vercel_[A-Za-z0-9_-]{20,})\b/ },
  { name: 'Private env assignment', pattern: /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|VERCEL_TOKEN|DATABASE_URL|JWT_SECRET)\s*=/i }
];

const contentExemptions = new Set([
  '.gitignore',
  'SECURITY.md',
  'tools/audit-public.mjs'
]);

const failures = [];

for (const file of tracked) {
  for (const rule of deniedTracked) {
    if (rule.test(file)) failures.push(`${file}: private path is tracked`);
  }

  if (contentExemptions.has(file)) continue;
  if (/\.(?:png|jpe?g|mp4|ico|webp|avif)$/i.test(file)) continue;

  const text = readFileSync(file, 'utf8');
  for (const rule of contentRules) {
    if (rule.pattern.test(text)) failures.push(`${file}: ${rule.name}`);
  }
}

if (failures.length) {
  console.error('Public audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Public audit passed (${tracked.length} public files checked).`);
