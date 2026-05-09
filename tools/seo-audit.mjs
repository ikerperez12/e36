import { existsSync, readFileSync } from 'node:fs';

const SITE = 'https://e36.vercel.app';
const INDEXNOW_KEY = '9f3d0a0a6efb4a35b0e7a4c94649d8aa';
const failures = [];

function read(file) {
  return readFileSync(file, 'utf8');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function requireIncludes(file, text, label = text) {
  expect(read(file).includes(text), `${file}: missing ${label}`);
}

function absoluteUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.host === new URL(SITE).host;
  } catch {
    return false;
  }
}

const index = read('index.html');
const legal = read('legal.html');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');

requireIncludes('index.html', `<link rel="canonical" href="${SITE}/">`, 'absolute home canonical');
requireIncludes('legal.html', `<link rel="canonical" href="${SITE}/legal.html">`, 'absolute legal canonical');
requireIncludes('robots.txt', `Sitemap: ${SITE}/sitemap.xml`, 'absolute sitemap entry');
requireIncludes('robots.txt', 'Disallow: /api/', 'api disallow');
requireIncludes('index.html', '<script type="application/ld+json">', 'structured data');
requireIncludes('index.html', '<meta name="keywords"', 'keyword metadata');
requireIncludes('legal.html', '<meta name="keywords"', 'legal keyword metadata');
requireIncludes('vercel.json', '"X-Robots-Tag"', 'api robots header');

expect(existsSync('google6a5cbce09f2cfee5.html'), 'Google verification file missing');
expect(
  read('google6a5cbce09f2cfee5.html').trim() === 'google-site-verification: google6a5cbce09f2cfee5.html',
  'Google verification file content mismatch'
);

expect(existsSync(`${INDEXNOW_KEY}.txt`), 'IndexNow key file missing');
expect(read(`${INDEXNOW_KEY}.txt`).trim() === INDEXNOW_KEY, 'IndexNow key file content mismatch');

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
expect(locs.length >= 2, 'sitemap must contain public URLs');
expect(new Set(locs).size === locs.length, 'sitemap contains duplicated URLs');
for (const loc of locs) {
  expect(absoluteUrl(loc), `sitemap URL is not an absolute site URL: ${loc}`);
}
expect(locs.includes(`${SITE}/`), 'sitemap missing home');
expect(locs.includes(`${SITE}/legal.html`), 'sitemap missing legal page');
expect(!sitemap.includes('google6a5cbce09f2cfee5.html'), 'sitemap should not include verification files');

for (const [file, html] of [['index.html', index], ['legal.html', legal]]) {
  expect(!/<meta\s+name=["']robots["'][^>]+noindex/i.test(html), `${file}: must not be noindex`);
  expect(/<meta\s+name=["']description["'][^>]+content=["'][^"']{70,180}["']/i.test(html), `${file}: description should be present and concise`);
  expect(/<meta\s+property=["']og:image["'][^>]+https:\/\/e36\.vercel\.app\/assets\/og-image\.jpg/i.test(html), `${file}: missing absolute OG image`);
}

if (failures.length) {
  console.error('SEO audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO audit passed (${locs.length} sitemap URLs, Google verification, IndexNow ready).`);
