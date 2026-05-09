import { readFileSync } from 'node:fs';

const SITE = 'https://e36.vercel.app';
const KEY = '9f3d0a0a6efb4a35b0e7a4c94649d8aa';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const dryRun = process.argv.includes('--dry-run');

const sitemap = readFileSync('sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!urls.length) {
  console.error('No URLs found in sitemap.xml');
  process.exit(1);
}

const host = new URL(SITE).host;
for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.host !== host || parsed.protocol !== 'https:') {
    console.error(`Refusing to submit URL outside ${SITE}: ${url}`);
    process.exit(1);
  }
}

const payload = {
  host,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

if (response.status !== 200) {
  const text = await response.text().catch(() => '');
  console.error(`IndexNow submission failed: HTTP ${response.status}${text ? ` - ${text}` : ''}`);
  process.exit(1);
}

console.log(`IndexNow submitted ${urls.length} URLs for ${host}.`);
